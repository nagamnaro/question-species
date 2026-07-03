questions = {
    "puzzle": [
        "A farmer has 17 sheep. All but 9 run away. How many are left?",
        "You see a man lying dead in a field with a sealed package next to him. What happened?",
        "A light bulb is in a locked room with 3 switches outside. You can only enter once. How do you find the correct switch?",
        "What comes next: 2, 6, 12, 20, 30, ?",
        "A man pushes his car to a hotel and declares bankruptcy. Why?",
        "You have 3 boxes: apples, oranges, mixed. All labels are wrong. You pick one fruit from one box. How do you relabel all correctly?",
        "A woman shoots her husband, holds him underwater for 5 minutes, then hangs him. Yet he survives. Explain.",
        "Which weighs more: a kilogram of feathers or a kilogram of steel?",
        "A prisoner must choose 1 of 2 doors: one leads to freedom, one to death. Two guards, one lies always. What question do you ask?",
        "A sequence: 1, 11, 21, 1211, 111221, what comes next?",
        "You cross a river with a fox, chicken, grain. How?",
        "A man builds a house with all windows facing south and sees a bear. Where is he?",
        "What disappears as soon as you name it?",
        "A clock shows 3:15. What is the angle between hands?",
        "You throw a ball straight up. It comes back without bouncing. Why?",
        "A man is born in 2000 and dies in 1995. How?",
        "Two fathers and two sons eat three burgers each. Only 3 burgers total. How?",
        "You enter a room with no doors or windows. How do you get out?",
        "What is always in front of you but can't be seen?",
        "You are in a race and pass the person in 2nd place. What position are you now?",
    ],
    "opinion": [
        "Should voting be mandatory in democracies?",
        "Is it morally acceptable to lie to protect someone's feelings?",
        "Should billionaires exist?",
        "Is social media doing more harm than good?",
        "Would you erase your worst memory if you could?",
        "Is free speech more important than preventing harm?",
        "Should AI be allowed to make legal decisions?",
        "Is cheating ever justified in exams if no one is harmed?",
        "Should prisons focus on punishment or rehabilitation?",
        "Is happiness or meaning more important in life?",
        "Would you give up 10 years of life for perfect health?",
        "Should we genetically enhance humans?",
        "Is privacy more important than safety?",
        "Should animals have legal rights similar to humans?",
        "Is capitalism fundamentally fair?",
        "Should parents be allowed to choose their child's traits?",
        "Is war ever justified?",
        "Should people be allowed to opt out of society?",
        "Is intelligence or kindness more important in leadership?",
        "Would you live in a world with no religion if it reduced conflict?",
    ],
    "prediction": [
        "Will humans land on Mars before 2040?",
        "Will AI replace most white-collar jobs by 2050?",
        "What % of jobs will be remote in 10 years?",
        "Will cash disappear in developed countries?",
        "Will there be a World War in your lifetime?",
        "What % chance do you give that AGI exists by 2035?",
        "Will brain-computer interfaces become mainstream?",
        "Will housing become more affordable in cities?",
        "Will climate change make parts of Earth uninhabitable by 2100?",
        "Will humans cure all cancers within 50 years?",
        "Will education become mostly AI-driven?",
        "What % chance do you give that we discover alien life?",
        "Will social media be regulated heavily by governments?",
        "Will there be universal basic income in major economies?",
        "Will electric planes become common?",
        "Will most people have 100+ year lifespans?",
        "Will digital currencies replace fiat money?",
        "Will war decrease globally over the next 50 years?",
        "Will meat consumption drop by 50% globally?",
        "Will humans colonise another planet?",
    ],
    "estimation": [
        "How many people are currently in the air globally?",
        "How many piano tuners are there in London?",
        "How many times does a human heart beat in a lifetime?",
        "How many smartphones exist worldwide right now?",
        "How many words does an average person speak per day?",
        "How many grains of sand are on Earth (order of magnitude)?",
        "How many people have ever lived?",
        "How many messages are sent on WhatsApp per day?",
        "How many books exist in the world today?",
        "How many seconds are in a lifetime?",
        "How many stars are visible from Earth without a telescope?",
        "How many bicycles exist globally?",
        "How many cups of coffee are consumed daily worldwide?",
        "How many apps are installed on an average phone?",
        "How many trees exist on Earth?",
        "How many people have ever climbed Mount Everest?",
        "How many languages are currently spoken?",
        "How many tweets are posted per day?",
        "How many humans have never flown in a plane?",
        "How many hours does humanity spend on social media per day?",
    ],
    "brainstorm": [
        "How would you redesign cities to eliminate loneliness?",
        "What would education look like if grades didn't exist?",
        "How could we reduce political polarisation?",
        "How would you design a fair global tax system?",
        "How could we make public transport feel like a game?",
        "What would a perfect news platform look like?",
        "How could we make people read more books?",
        "How would you fix dating apps?",
        "How could we make exercise addictive?",
        "What would a society without money look like?",
        "How could we improve trust in science?",
        "How would you redesign democracy for the internet age?",
        "How could we reduce phone addiction without banning phones?",
        "What would replace universities?",
        "How could we make people more empathetic to strangers?",
        "How would you redesign social media from scratch?",
        "How could we make voting more informed?",
        "What would a 4-day workweek society require?",
        "How could we make climate action feel personally rewarding?",
        "How would you design a system where everyone teaches and learns?",
    ],
}

tags = {
    "puzzle": ["logic", "lateral"],
    "opinion": ["ethics", "society"],
    "prediction": ["future", "tech"],
    "estimation": ["fermi", "numbers"],
    "brainstorm": ["ideas", "design"],
}

import random

random.seed(42)
rows = []
for species, qs in questions.items():
    for i, q in enumerate(qs):
        esc = q.replace("'", "''")
        up = random.randint(25, 220)
        diff = (
            "NULL"
            if species in ("opinion", "prediction", "brainstorm")
            else str(1 + (i % 4))
        )
        t = tags[species]
        rows.append(
            f"  ('{esc}', '{species}', ARRAY['{t[0]}', '{t[1]}'], {up}, {diff})"
        )

out = (
    "-- Seed 100 curated questions (20 per species)\n"
    "INSERT INTO public.questions (text, species, tags, upvotes, difficulty)\n"
    "VALUES\n"
    + ",\n".join(rows)
    + ";\n"
)

path = (
    r"C:\Users\oranm\OneDrive - Imperial College London\Question Species"
    r"\supabase\migrations\20260307193000_seed_curated_questions.sql"
)
with open(path, "w", encoding="utf-8") as f:
    f.write(out)
print(f"Wrote {len(rows)} questions to {path}")
