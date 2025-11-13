import random, time

class Node:
    def __init__(self, name, pos):
        self.name = name
        self.pos = pos
        self.buffer = []

nodes = [Node("RescuerA", 0), Node("RescuerB", 40), Node("CommandCenter", 100)]
messages = [{"id": 1, "src": "RescuerA", "dst": "CommandCenter", "data": "Found 3 survivors", "delivered": False}]

for t in range(20):
    for n in nodes:
        n.pos += random.randint(-10, 10)

    for n1 in nodes:
        for n2 in nodes:
            if n1 != n2 and abs(n1.pos - n2.pos) < 30:
                for m in messages:
                    if not m["delivered"] and m["src"] == n1.name:
                        print(f"{n1.name} passes message {m['id']} to {n2.name}")
                        if n2.name == m["dst"]:
                            print(f"Delivered to {n2.name} ✅")
                            m["delivered"] = True
    time.sleep(1)
