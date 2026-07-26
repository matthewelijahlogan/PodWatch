sub init()
    m.top.functionName = "run"
end sub

sub run()
    result = {
        ok: false
        data: invalid
        error: ""
    }

    if m.top.baseUrl = invalid or m.top.endpoint = invalid
        result.error = "Missing baseUrl or endpoint"
        m.top.result = result
        return
    end if

    transfer = CreateObject("roUrlTransfer")
    transfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.InitClientCertificates()
    transfer.SetConnectionTimeout(15)
    transfer.SetMinimumTransferRate(1, 30)
    transfer.AddHeader("Accept", "application/json")
    transfer.AddHeader("User-Agent", "PodWatch-Roku/1.0")
    transfer.SetUrl(m.top.baseUrl + m.top.endpoint)

    response = transfer.GetToString()
    code = transfer.GetResponseCode()

    if code >= 200 and code < 300
        json = ParseJson(response)
        result.ok = true
        result.data = json
    else
        result.error = "HTTP " + code.ToStr()
    end if

    m.top.result = result
end sub
