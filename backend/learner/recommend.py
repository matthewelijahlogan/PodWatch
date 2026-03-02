# backend/learner/recommend.py

def simple_recommendation(user_history, all_podcasts):
    """
    Very basic starter recommender:
    - user_history: list of podcast IDs the user liked/listened to
    - all_podcasts: list of all podcast dicts from your data
    
    Returns a list of recommended podcasts (dicts).
    """
    # For now, just recommend podcasts not in user_history
    recommendations = [pod for pod in all_podcasts if pod['id'] not in user_history]

    # Could add sorting by trending or editor_pick as a bonus
    recommendations.sort(key=lambda p: p.get('trending', False), reverse=True)
    
    return recommendations[:5]  # Top 5 recs
