sub init()
    m.baseUrl = "https://podwatch.onrender.com"
    m.tabs = [
        "Home",
        "Top Shows",
        "Guide",
        "Discover Top",
        "Editors Picks",
        "Categories",
        "Recommended",
        "New Episodes"
    ]

    m.tabList = m.top.findNode("tabList")
    m.itemList = m.top.findNode("itemList")
    m.sectionLabel = m.top.findNode("sectionLabel")
    m.statusLabel = m.top.findNode("statusLabel")
    m.detailLabel = m.top.findNode("detailLabel")

    m.detailModal = m.top.findNode("detailModal")
    m.modalTitle = m.top.findNode("modalTitle")
    m.modalSub = m.top.findNode("modalSub")
    m.modalBody = m.top.findNode("modalBody")
    m.modalPlayerFrame = m.top.findNode("modalPlayerFrame")
    m.modalPlayerPreview = m.top.findNode("modalPlayerPreview")

    m.tabList.content = makeListContent(m.tabs)
    m.tabList.observeFieldScoped("itemSelected", "onTabSelected")
    m.itemList.observeFieldScoped("itemSelected", "onItemSelected")

    m.currentSection = "Home"
    m.currentItems = []
    m.currentDetails = []
    m.currentData = []

    m.pendingModalTitle = ""
    m.pendingModalSub = ""
    m.pendingModalBody = ""
    m.modalBaseBody = ""
    m.pendingLatest = []
    m.pendingTop = []

    m.top.setFocus(true)
    m.tabList.setFocus(true)
    m.tabList.jumpToItem = 0

    loadSection("Home")
    checkBackendHealth()
end sub

function onKeyEvent(key as string, press as boolean) as boolean
    if press = false then return false

    if m.detailModal.visible = true
        if key = "back" or key = "OK"
            closeModal()
            return true
        end if
        return true
    end if

    if key = "right" and m.tabList.hasFocus()
        m.itemList.setFocus(true)
        return true
    end if

    if key = "left" and m.itemList.hasFocus()
        m.tabList.setFocus(true)
        return true
    end if

    if key = "OK" and m.itemList.hasFocus()
        openSelectedItemDetail()
        return true
    end if

    return false
end function

sub checkBackendHealth()
    m.healthTask = CreateObject("roSGNode", "ApiTask")
    m.healthTask.observeFieldScoped("result", "onHealthLoaded")
    m.healthTask.baseUrl = m.baseUrl
    m.healthTask.endpoint = "/api/health"
    m.healthTask.control = "RUN"
end sub

sub onHealthLoaded()
    result = m.healthTask.result
    if result = invalid or result.ok <> true
        m.statusLabel.text = "Backend unreachable at " + m.baseUrl
        return
    end if

    payload = result.data
    if payload <> invalid and payload.status <> invalid
        m.statusLabel.text = "Backend: " + safeText(payload.status) + " (" + m.baseUrl + ")"
    else
        m.statusLabel.text = "Backend connected (" + m.baseUrl + ")"
    end if
end sub

sub onTabSelected()
    idx = m.tabList.itemSelected
    if idx = invalid then return
    if idx < 0 or idx >= m.tabs.Count() then return

    section = m.tabs[idx]
    loadSection(section)
end sub

sub onItemSelected()
    idx = m.itemList.itemSelected
    if idx = invalid then return
    if idx < 0 or idx >= m.currentDetails.Count() then return

    m.detailLabel.text = m.currentDetails[idx]
end sub

sub loadSection(section as string)
    m.currentSection = section
    m.sectionLabel.text = section

    if section = "Home"
        items = [
            "Welcome to PodWatch Roku",
            "Browse top podcasts and featured comedy shows",
            "Use LEFT/RIGHT to move between section and content"
        ]
        details = [
            "PodWatch centralizes podcast discovery for Roku.",
            "Top Shows and Discover pull data from the backend API.",
            "Press OK on any content item to open expanded details."
        ]
        m.currentData = []
        setItems(items, details)
        m.statusLabel.text = "Ready"
        return
    end if

    endpoint = ""
    if section = "Top Shows" or section = "Discover Top" or section = "New Episodes"
        endpoint = "/api/podcasts?page=1&per_page=20"
    else if section = "Guide"
        endpoint = "/api/featured-shows"
    else if section = "Editors Picks"
        endpoint = "/api/editors-picks"
    else if section = "Categories"
        endpoint = "/api/categories"
    else if section = "Recommended"
        endpoint = "/api/recommend"
    end if

    if endpoint = ""
        m.currentData = []
        setItems(["No data source configured"], ["Missing endpoint mapping."])
        return
    end if

    m.statusLabel.text = "Loading " + section + " ..."
    m.currentData = []
    setItems(["Loading..."], ["Please wait."])
    requestSection(endpoint, section)
end sub

sub requestSection(endpoint as string, section as string)
    m.pendingSection = section
    m.task = CreateObject("roSGNode", "ApiTask")
    m.task.observeFieldScoped("result", "onApiResult")
    m.task.baseUrl = m.baseUrl
    m.task.endpoint = endpoint
    m.task.control = "RUN"
end sub

sub onApiResult()
    result = m.task.result

    if result = invalid or result.ok <> true
        msg = "Request failed"
        if result <> invalid and result.error <> invalid then msg = result.error
        m.statusLabel.text = msg
        setItems(["Failed to load section"], ["Check backend URL and connectivity."])
        m.currentData = []
        return
    end if

    data = result.data
    items = []
    details = []
    objects = []

    section = m.pendingSection

    if section = "Top Shows" or section = "Discover Top" or section = "New Episodes" or section = "Recommended"
        podcasts = data.podcasts
        if podcasts = invalid then podcasts = data

        for each pod in podcasts
            rank = ""
            if pod.rank <> invalid then rank = pod.rank.ToStr() + ". "
            title = safeText(pod.title)
            author = safeText(pod.author)
            items.Push(rank + title)
            details.Push("Author: " + author)
            objects.Push(pod)
        end for
    else if section = "Editors Picks"
        for each pick in data
            items.Push(safeText(pick.title))
            details.Push("By " + safeText(pick.author) + " - " + safeText(pick.description))
            objects.Push(pick)
        end for
    else if section = "Categories"
        for each cat in data
            items.Push(safeText(cat.name))
            details.Push(safeText(cat.description))
            objects.Push(cat)
        end for
    else if section = "Guide"
        for each show in data
            items.Push(safeText(show.title) + " (" + safeText(show.host) + ")")
            details.Push(safeText(show.description))
            objects.Push(show)
        end for
    end if

    if items.Count() = 0
        items = ["No results"]
        details = ["The API returned an empty list."]
    end if

    m.currentData = objects
    setItems(items, details)
    m.statusLabel.text = "Loaded " + section
end sub

sub openSelectedItemDetail()
    idx = m.itemList.itemSelected
    if idx = invalid then return

    if idx < 0 or idx >= m.currentItems.Count() then return

    section = m.currentSection
    title = m.currentItems[idx]
    detail = m.currentDetails[idx]

    if section = "Home"
        openModal(title, section, detail)
        return
    end if

    item = invalid
    if idx < m.currentData.Count() then item = m.currentData[idx]

    if section = "Guide" and item <> invalid
        showId = safeText(item.id)
        if showId <> ""
            openGuideDetail(showId)
            return
        end if
    end if

    query = title
    if item <> invalid and item.title <> invalid then query = safeText(item.title)

    openPodcastDetail(query, title, detail)
end sub

sub openGuideDetail(showId as string)
    endpoint = "/api/featured-shows/" + showId
    guideTask = CreateObject("roSGNode", "ApiTask")
    guideTask.observeFieldScoped("result", "onGuideDetailLoaded")
    guideTask.baseUrl = m.baseUrl
    guideTask.endpoint = endpoint
    guideTask.control = "RUN"
    m.guideDetailTask = guideTask

    openModal("Loading show detail...", "Guide", "Please wait.")
end sub

sub onGuideDetailLoaded()
    result = m.guideDetailTask.result
    if result = invalid or result.ok <> true or result.data = invalid
        openModal("Guide Detail", "Error", "Unable to load show detail.")
        return
    end if

    show = result.data
    title = safeText(show.title)
    host = safeText(show.host)
    body = safeText(show.description) + chr(10) + chr(10)
    body = body + "Host Profile: " + safeText(show.bio) + chr(10) + chr(10)

    if show.stats <> invalid and show.stats.Count() > 0
        body = body + "Stats:" + chr(10)
        for each stat in show.stats
            body = body + "- " + safeText(stat) + chr(10)
        end for
        body = body + chr(10)
    end if

    if show.sponsors <> invalid and show.sponsors.Count() > 0
        body = body + "Sponsors:" + chr(10)
        for each s in show.sponsors
            body = body + "- " + safeText(s) + chr(10)
        end for
        body = body + chr(10)
    end if

    if show.tours <> invalid and show.tours.Count() > 0
        body = body + "Tour Dates:" + chr(10)
        for each t in show.tours
            body = body + "- " + safeText(t) + chr(10)
        end for
    end if

    openModal(title, host, body)
    openEpisodeRequests(title)
end sub

sub openPodcastDetail(query as string, title as string, detail as string)
    body = detail + chr(10) + chr(10) + "Loading latest and top episodes..."
    openModal(title, m.currentSection, body)
    openEpisodeRequests(query)
end sub

sub openEpisodeRequests(query as string)
    m.pendingLatest = []
    m.pendingTop = []

    encoded = urlEncode(query)

    m.latestTask = CreateObject("roSGNode", "ApiTask")
    m.latestTask.observeFieldScoped("result", "onLatestEpisodesLoaded")
    m.latestTask.baseUrl = m.baseUrl
    m.latestTask.endpoint = "/api/youtube/latest?q=" + encoded
    m.latestTask.control = "RUN"

    m.topTask = CreateObject("roSGNode", "ApiTask")
    m.topTask.observeFieldScoped("result", "onTopEpisodesLoaded")
    m.topTask.baseUrl = m.baseUrl
    m.topTask.endpoint = "/api/youtube/top?q=" + encoded
    m.topTask.control = "RUN"
end sub

sub onLatestEpisodesLoaded()
    result = m.latestTask.result
    if result <> invalid and result.ok = true and result.data <> invalid
        m.pendingLatest = result.data
    else
        m.pendingLatest = []
    end if
    refreshModalEpisodes()
end sub

sub onTopEpisodesLoaded()
    result = m.topTask.result
    if result <> invalid and result.ok = true and result.data <> invalid
        m.pendingTop = result.data
    else
        m.pendingTop = []
    end if
    refreshModalEpisodes()
end sub

sub refreshModalEpisodes()
    if m.detailModal.visible = false then return

    body = m.modalBaseBody

    body = body + chr(10) + chr(10) + "Latest Episodes:" + chr(10)
    if m.pendingLatest.Count() = 0
        body = body + "- No episodes available" + chr(10)
    else
        for each ep in m.pendingLatest
            body = body + "- " + safeText(ep.title) + chr(10)
        end for
    end if

    body = body + chr(10) + "Top Episodes:" + chr(10)
    if m.pendingTop.Count() = 0
        body = body + "- No episodes available" + chr(10)
    else
        for each ep in m.pendingTop
            body = body + "- " + safeText(ep.title) + chr(10)
        end for
    end if

    m.modalBody.text = body
    updateModalPlayerPreview()
end sub

sub openModal(title as string, subtitle as string, body as string)
    m.modalTitle.text = title
    m.modalSub.text = subtitle
    m.modalBaseBody = body
    m.modalBody.text = body
    if m.modalPlayerFrame <> invalid then m.modalPlayerFrame.visible = false
    if m.modalPlayerPreview <> invalid then
        m.modalPlayerPreview.visible = false
        m.modalPlayerPreview.uri = ""
    end if
    m.detailModal.visible = true
end sub

sub closeModal()
    m.detailModal.visible = false
    if m.modalPlayerPreview <> invalid then
        m.modalPlayerPreview.visible = false
        m.modalPlayerPreview.uri = ""
    end if
    if m.modalPlayerFrame <> invalid then m.modalPlayerFrame.visible = false
end sub

function makeListContent(items as object) as object
    root = CreateObject("roSGNode", "ContentNode")

    for each label in items
        child = root.CreateChild("ContentNode")
        child.title = label
    end for

    return root
end function

sub setItems(items as object, details as object)
    m.currentItems = items
    m.currentDetails = details
    m.itemList.content = makeListContent(items)
    m.itemList.jumpToItem = 0
    if details.Count() > 0
        m.detailLabel.text = details[0]
    else
        m.detailLabel.text = ""
    end if
end sub

function safeText(value as dynamic) as string
    if value = invalid then return ""
    return value.ToStr()
end function

function urlEncode(value as string) as string
    s = value
    s = s.Replace(" ", "+")
    s = s.Replace("&", "%26")
    s = s.Replace("'", "%27")
    s = s.Replace("#", "%23")
    return s
end function

sub updateModalPlayerPreview()
    if m.modalPlayerFrame = invalid or m.modalPlayerPreview = invalid then return

    sampleUrl = ""
    if m.pendingLatest <> invalid and m.pendingLatest.Count() > 0
        first = m.pendingLatest[0]
        if first <> invalid and first.url <> invalid
            sampleUrl = safeText(first.url)
        end if
    else if m.pendingTop <> invalid and m.pendingTop.Count() > 0
        firstTop = m.pendingTop[0]
        if firstTop <> invalid and firstTop.url <> invalid
            sampleUrl = safeText(firstTop.url)
        end if
    end if

    videoId = extractYouTubeVideoId(sampleUrl)
    if videoId = ""
        m.modalPlayerFrame.visible = false
        m.modalPlayerPreview.visible = false
        return
    end if

    isPortrait = instr(1, sampleUrl, "/shorts/") > 0
    if isPortrait
        m.modalPlayerFrame.uri = "pkg:/images/portraitFrame.png"
        m.modalPlayerFrame.translation = [365, 292]
        m.modalPlayerFrame.width = 450
        m.modalPlayerFrame.height = 300
        m.modalPlayerPreview.translation = [415, 346]
        m.modalPlayerPreview.width = 351
        m.modalPlayerPreview.height = 183
    else
        m.modalPlayerFrame.uri = "pkg:/images/landscapeFrame.png"
        m.modalPlayerFrame.translation = [180, 330]
        m.modalPlayerFrame.width = 820
        m.modalPlayerFrame.height = 250
        m.modalPlayerPreview.translation = [272, 378]
        m.modalPlayerPreview.width = 636
        m.modalPlayerPreview.height = 141
    end if

    m.modalPlayerPreview.uri = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg"
    m.modalPlayerFrame.visible = true
    m.modalPlayerPreview.visible = true
end sub

function extractYouTubeVideoId(url as string) as string
    if url = invalid or url = "" then return ""

    pos = instr(1, url, "v=")
    if pos > 0
        candidate = mid(url, pos + 2)
        amp = instr(1, candidate, "&")
        if amp > 0 then candidate = left(candidate, amp - 1)
        if len(candidate) >= 11 then return left(candidate, 11)
    end if

    shortsPos = instr(1, url, "/shorts/")
    if shortsPos > 0
        afterShorts = mid(url, shortsPos + 8)
        slash = instr(1, afterShorts, "/")
        if slash > 0 then afterShorts = left(afterShorts, slash - 1)
        q = instr(1, afterShorts, "?")
        if q > 0 then afterShorts = left(afterShorts, q - 1)
        if len(afterShorts) >= 11 then return left(afterShorts, 11)
    end if

    ytuPos = instr(1, url, "youtu.be/")
    if ytuPos > 0
        afterShort = mid(url, ytuPos + 9)
        q2 = instr(1, afterShort, "?")
        if q2 > 0 then afterShort = left(afterShort, q2 - 1)
        if len(afterShort) >= 11 then return left(afterShort, 11)
    end if

    return ""
end function
