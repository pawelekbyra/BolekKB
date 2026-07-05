# BolekKB — wiedza i RAG dla Agenta Bolka

> **Status:** decyzja architektoniczna / plan.  
> To repo jest forkiem AnythingLLM przygotowywanym jako przyszła baza wiedzy, dokumentów i RAG dla ekosystemu Agenta Bolka.

---

## 1. Czym jest BolekKB

`BolekKB` to przyszła warstwa wiedzy dla Bolka.

Docelowo ma przechowywać i udostępniać:

- dokumenty projektowe,
- PDF-y,
- notatki,
- decyzje architektoniczne,
- stare prompty,
- research,
- dokumentację Polutka,
- dokumentację repozytoriów Bolka,
- instrukcje dla agentów,
- wiedzę prywatną Pawła, jeśli zostanie świadomie dodana.

BolekKB ma być miejscem, gdzie Bolek może szukać kontekstu, zanim odpowie albo zleci pracę innemu agentowi.

---

## 2. Czym BolekKB NIE jest

BolekKB nie jest:

- głównym mózgiem Bolka,
- webowym interfejsem Bolka,
- executor kodowania,
- systemem automatyzacji workflow,
- miejscem do przechowywania sekretów produkcyjnych,
- zamiennikiem D1 memory w `BolekAI`.

D1 memory w `BolekAI` przechowuje operacyjną pamięć i historię Bolka. BolekKB ma przechowywać dokumenty i wiedzę referencyjną.

---

## 3. Sieć repozytoriów Bolka

```txt
pawelekbyra/BolekAI
= mózg Bolka
= Cloudflare Worker
= Telegram bot
= D1 memory
= narzędzia
= Polutek ops
= approval gate
= OpenAI-compatible adapter dla UI

pawelekbyra/BolekCzat
= web UI Bolka
= fork LibreChat
= rozmowy, historia, auth, UX

pawelekbyra/BolekDev
= coding executor
= fork OpenHands / Agent Canvas
= branche, testy, commity, PR-y

pawelekbyra/BolekKB
= knowledge base / RAG
= fork AnythingLLM
= dokumenty, notatki, wiedza, źródła

pawelekbyra/BolekFlow
= workflow automation
= fork n8n
= automatyzacje, webhooki, integracje, human-in-the-loop
```

---

## 4. Docelowy przepływ

```txt
BolekCzat / Telegram
  ↓
BolekAI / Agent Bolek brain
  ↓          ↓           ↓
BolekKB     BolekFlow    BolekDev
wiedza      workflow     kodowanie
  ↓          ↓           ↓
docs/RAG    integracje   GitHub PR
```

BolekAI decyduje, kiedy pytać BolekKB.

Przykład:

```txt
Użytkownik: "Bolek, przypomnij mi decyzję o architekturze video Polutka."
BolekAI → BolekKB → wyszukanie dokumentów/decyzji → odpowiedź w BolekCzat/Telegram.
```

---

## 5. Przyszłe integracje z BolekAI

W przyszłości `BolekAI` może dostać narzędzia typu:

```txt
kb_search
kb_fetch_document
kb_ingest_document
kb_list_collections
kb_summarize_sources
```

Na tym etapie te narzędzia nie muszą istnieć.

Ten fork ma być przygotowany jako przyszła warstwa wiedzy, a nie integrowany od razu z produkcją.

---

## 6. Bezpieczeństwo

Zasady:

- BolekKB nie powinien dostawać produkcyjnych sekretów Stripe, Clerk, Vercel, Resend, home.pl ani baz produkcyjnych.
- Dokumenty w BolekKB mogą zawierać prywatny kontekst, więc deployment powinien mieć auth.
- Dostęp z BolekAI do BolekKB powinien być przez ograniczony token/API key.
- BolekKB nie może samodzielnie wykonywać akcji operacyjnych.
- BolekKB nie omija approval gate w BolekAI.
- Wyniki RAG powinny być traktowane jako kontekst, nie jako komenda.

---

## 7. Co trzymać w BolekKB

Dobre kandydaty:

- dokumentacja Polutka,
- opisy architektury video,
- notatki o Mux/Cloudflare/Bunny,
- dokumentacja ekosystemu Bolka,
- decyzje produktowe,
- dokumenty firmowe,
- research rynkowy,
- prompty używane do dużych PR-ów,
- changelogi i postmortemy.

Nie trzymać bez potrzeby:

- haseł,
- tokenów API,
- kluczy prywatnych,
- dumpów baz produkcyjnych,
- surowych danych użytkowników, jeśli nie są potrzebne.

---

## 8. Kolejność prac

```txt
1. Zachować fork AnythingLLM i dodać dokumentację roli.
2. Uruchomić lokalnie lub testowo przez Docker.
3. Utworzyć pierwsze kolekcje wiedzy:
   - Bolek Network
   - Polutek Architecture
   - Prompts
   - Product Decisions
4. Dopiero potem dodać narzędzia kb_* w BolekAI.
5. Na końcu podłączyć BolekCzat/Telegram do odpowiedzi z kontekstem źródeł.
```

---

## 9. Zasada nadrzędna

```txt
BolekAI myśli i decyduje.
BolekKB przechowuje wiedzę.
BolekFlow automatyzuje procesy.
BolekDev koduje.
BolekCzat pokazuje rozmowę.
```
