import sys, traceback
import codecs
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
from datetime import datetime
from langgraph_agent import CampusTitanAgent

try:
    agent = CampusTitanAgent()
    
    queries = [
        "plan my diet for today's dinner",
        "suggest dinner for me based on what I ate today",
        "I ate 3 chapatis",
        "I ate 2 eggs and a banana",
        "I played badminton for 3 hrs",
        "I drank 2 banana shakes and ate an apple",
        "I drank pineapple juice and played cricket for 4 hrs",
        "I drank two glass banana shake and a glass of pineapple juice and ate a apple and played cricket for 4 hrs",
        "I played cricket for 4 hrs",
    ]
    
    user_context = {
        "name": "Devansh",
        "age": 22,
        "protein_goal": 60,
        "weekly_goal": 150
    }
    
    for q in queries:
        print(f"\n--- TESTING QUERY: {q} ---")
        try:
            res = agent.process_query(q, "f3b691e4-22e7-4eff-8bd9-7c27b57cff12", user_context)
            print("ANS:", res.answer)
            print("TOOL:", res.tool_used)
        except Exception as e:
            traceback.print_exc()

except Exception as e:
    traceback.print_exc()
