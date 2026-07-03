"""Generate discourse-themed question seed migration."""

import random

questions = {
    "opinion": [
        "Should governments ban TikTok over national security concerns?",
        "Is it ethical to use AI-generated art without crediting the model?",
        "Should Twitter/X prioritize free speech over content moderation?",
        "Is remote work better for society than return-to-office mandates?",
        "Should billionaires pay a wealth tax to fund public services?",
        "Is cancel culture a real problem or a myth used to avoid accountability?",
        "Should AI companies be required to open-source their models?",
        "Is universal basic income a good response to automation?",
        "Should children under 16 be banned from social media?",
        "Is nuclear energy essential for reaching net zero?",
        "Should police use facial recognition in public spaces?",
        "Is the gender pay gap mostly explained by choice or discrimination?",
        "Should universities use AI detectors on student essays?",
        "Is cryptocurrency mostly useful or mostly speculative harm?",
        "Should hate speech laws be expanded online?",
        "Is the 4-day work week realistic for most industries?",
        "Should influencers be regulated like traditional advertisers?",
        "Is meritocracy real in modern economies?",
        "Should gene editing in humans be allowed for disease prevention?",
        "Is economic growth compatible with serious climate action?",
    ],
    "prediction": [
        "Will a major country ban TikTok permanently by 2028?",
        "What % chance do you give that AGI arrives before 2032?",
        "Will remote work exceed 40% of knowledge jobs in 5 years?",
        "Will Bitcoin exceed its previous all-time high again by 2027?",
        "Will a US presidential election be significantly influenced by deepfakes?",
        "What % chance that EU passes comprehensive AI regulation by 2026?",
        "Will lab-grown meat capture 10% of the US market by 2035?",
        "Will global average temperatures rise more than 1.5°C by 2030?",
        "Will a major social platform switch to chronological feeds by default?",
        "What % chance of a serious cyberattack on critical infrastructure this decade?",
        "Will OpenAI remain the leading consumer AI brand in 3 years?",
        "Will student loan forgiveness become permanent policy in the US?",
        "What % chance that self-driving cars are common in major cities by 2035?",
        "Will mainstream news trust scores improve or decline over 5 years?",
        "Will a new pandemic cause comparable disruption before 2035?",
        "What % chance that UBI is piloted nationally in a G7 country by 2030?",
        "Will Reddit remain culturally relevant among under-25s?",
        "Will AI replace more jobs than it creates in the next 10 years?",
        "What % chance of a major platform exodus to decentralized social?",
        "Will space tourism become affordable for middle-class households?",
    ],
    "estimation": [
        "How many active ChatGPT users are there worldwide?",
        "How many hours per day does humanity spend on TikTok?",
        "How many political tweets are posted per day globally?",
        "How many people work in the AI industry worldwide?",
        "How many podcasts are published per week?",
        "How many deepfake videos are uploaded daily (order of magnitude)?",
        "How many Reddit posts reach the front page per day?",
        "How many gigabytes of data does an average person generate per year?",
        "How many news articles are published online per day?",
        "How many people participate in online polls or surveys daily?",
        "How many Discord servers have more than 1,000 members?",
        "How many Wikipedia edits happen per hour?",
        "How many phishing emails are sent per day?",
        "How many people have deleted a social media account in the past year?",
        "How many hours of video are uploaded to YouTube per minute?",
        "How many climate protest participants have there been globally (lifetime)?",
        "How many open-source GitHub repositories exist?",
        "How many online dating matches happen per day?",
        "How many government data requests do tech companies receive per year?",
        "How many newsletters are sent globally each day?",
    ],
    "brainstorm": [
        "How would you redesign Twitter/X to reduce outrage?",
        "How could we make fact-checking scale on social media?",
        "How would you fix online political polarisation?",
        "How could AI assistants reduce rather than increase misinformation?",
        "How would you design a fair creator economy for short-form video?",
        "How could we make climate discourse less toxic online?",
        "How would you rebuild trust in institutions using the internet?",
        "How could comment sections become constructive by default?",
        "How would you reduce doomscrolling without banning algorithms?",
        "How could online education replace credential inflation?",
        "How would you design a platform for productive disagreement?",
        "How could we verify human vs bot accounts at scale?",
        "How would you make local news financially sustainable?",
        "How could we reduce misinformation during elections?",
        "How would you redesign app notifications to protect attention?",
        "How could online communities self-moderate without heavy censorship?",
        "How would you help people escape filter bubbles voluntarily?",
        "How could public deliberation work at internet scale?",
        "How would you make AI transparency understandable to non-experts?",
        "How could we reward nuanced takes over hot takes?",
    ],
    "puzzle": [
        "A viral post claims 200% of people agree. What's wrong with that statement?",
        "If everyone shares a post, does reach grow linearly or exponentially?",
        "You see identical outrage posts from 50 accounts in 1 minute. What's likely happening?",
        "A poll shows 120% approval. How many errors minimum?",
        "Two headlines contradict each other on the same study. What should you check first?",
        "A chart Y-axis starts at 95%. Why is the visual misleading?",
        "If a bot farm doubles daily starting with 1 bot, how many after 10 days?",
        "A claim spreads faster than fact-checks. Which wins short-term?",
        "Sample size: 12 people polled nationally. Can you generalise?",
        "Correlation posted online implies causation. Name one alternative explanation.",
        "A meme uses a 10-year-old photo as 'today'. What cognitive bias applies?",
        "If 70% share without reading, what % actually read (estimate logic)?",
        "Two groups talk past each other using the same word differently. What's this?",
        "A headline says 'Scientists baffled' but the paper doesn't. What's missing?",
        "Viral math: 0.1% of 8 billion is how many people?",
        "If engagement rewards outrage, what behaviour gets selected?",
        "A study with n=8 goes viral. What's the minimum sensible response?",
        "Fake quote attributed to Einstein. What's your first verification step?",
        "If echo chambers amplify beliefs, what breaks the loop?",
        "A poll asks 'Have you stopped beating your wife?' Why is it invalid?",
    ],
}

tags = {
    "puzzle": ["discourse", "logic"],
    "opinion": ["discourse", "society"],
    "prediction": ["discourse", "future"],
    "estimation": ["discourse", "internet"],
    "brainstorm": ["discourse", "ideas"],
}

random.seed(7)
rows = []
for species, qs in questions.items():
    for i, q in enumerate(qs):
        esc = q.replace("'", "''")
        up = random.randint(40, 280)
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
    "-- Seed 100 discourse-focused questions (20 per species)\n"
    "INSERT INTO public.questions (text, species, tags, upvotes, difficulty)\n"
    "VALUES\n"
    + ",\n".join(rows)
    + ";\n"
)

path = (
    r"C:\Users\oranm\OneDrive - Imperial College London\Question Species"
    r"\supabase\migrations\20260307195500_seed_discourse_questions.sql"
)
with open(path, "w", encoding="utf-8") as f:
    f.write(out)
print(f"Wrote {len(rows)} questions to {path}")
