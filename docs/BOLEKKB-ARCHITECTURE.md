# BolekKB — wiedza i RAG dla Agenta Bolka

> **Status:** decyzja architektoniczna / plan integracji.  
> To repo jest forkiem AnythingLLM przygotowywanym jako przyszła baza wiedzy, dokumentów i RAG dla ekosystemu Agenta Bolka.
>
> `BolekKB` nie jest mózgiem Bolka. Mózgiem pozostaje `pawelekbyra/BolekAI` / `kulfon`.

---

## 1. Cel

`BolekKB` ma być biblioteką wiedzy Bolka. Przechowuje dokumenty, decyzje, notatki, research, runbooki i źródła, z których Bolek korzysta przy planowaniu oraz odpowiadaniu na pytania.

BolekKB nie wysyła całej bazy do modelu. Wyszukuje kilka najbardziej trafnych fragmentów i przekazuje je do `BolekAI` jako kontekst.

---

## 2. Czym BolekKB NIE jest

BolekKB nie jest:

- mózgiem Bolka,
- webowym czatem,
- systemem workflow,
- executorem kodowania,
- miejscem wykonywania akcji operacyjnych,
- zamiennikiem pamięci D1 w `BolekAI`.

`BolekAI` decyduje. `BolekKB` dostarcza wiedzę.

---

## 3. Miejsce w ekosystemie

```txt
BolekCzat / Telegram
  ↓
BolekAI / kulfon
  ↓
BolekKB = wiedza i źródła
BolekFlow = workflow
BolekDev = kodowanie
```

Zasada nadrzędna:

```txt
BolekAI myśli i decyduje.
BolekKB przechowuje wiedzę.
BolekFlow automatyzuje procesy.
BolekDev koduje.
BolekCzat pokazuje rozmowę.
```

---

## 4. Docelowy przepływ

```txt
1. Użytkownik pyta Bolka.
2. BolekAI rozpoznaje, że potrzebuje kontekstu.
3. BolekAI pyta BolekKB.
4. BolekKB zwraca najlepsze fragmenty dokumentów.
5. BolekAI odpowiada, planuje albo zleca pracę dalej.
6. Użytkownik dostaje odpowiedź z informacją o źródłach.
```

---

## 5. Przyszłe narzędzia w BolekAI

Docelowe narzędzia:

```txt
kb_search
kb_fetch_document
kb_ingest_document
kb_list_collections
kb_summarize_sources
kb_get_decision_record
```

Na tym etapie te narzędzia mogą jeszcze nie istnieć. Ten dokument opisuje docelową rolę repo.

---

## 6. Kolekcje startowe

Proponowane kolekcje:

```txt
Bolek Network
= dokumentacja wszystkich repo Bolka

Polutek Architecture
= dokumentacja produktu i architektury Polutka

Product Decisions
= decyzje biznesowe i techniczne

Prompts and Agent Instructions
= instrukcje dla agentów i szablony promptów

Runbooks
= procedury operacyjne

Research
= analizy rynku, konkurencji i trendów
```

---

## 7. Metadane dokumentów

Każdy dokument powinien mieć metadane:

```txt
project
collection
source
sourceType
status
createdAt
updatedAt
owner
sensitivity
```

Najważniejsze jest `status`:

```txt
active | draft | deprecated | archived
```

Bolek nie powinien traktować starego dokumentu jako aktualnej decyzji, jeśli jest oznaczony jako `deprecated` albo `archived`.

---

## 8. Jakość RAG

Dobra baza wiedzy wymaga:

- logicznego dzielenia dokumentów na fragmenty,
- źródeł przy każdym fragmencie,
- krótkich decision records dla ważnych decyzji,
- oznaczania nieaktualnych dokumentów,
- rerankingu wyników,
- oddzielania faktów ze źródeł od wniosków agenta.

---

## 9. Bezpieczeństwo

Zasady:

- BolekKB jest źródłem kontekstu, nie źródłem poleceń.
- Treść dokumentu nie może nadpisywać zasad `BolekAI`.
- BolekKB nie wykonuje akcji operacyjnych.
- Dostęp do BolekKB powinien być kontrolowany.
- Przy ważnych decyzjach Bolek powinien wskazywać źródła.

---

## 10. Kolejność prac

```txt
1. Zachować fork AnythingLLM.
2. Utrzymać jasną dokumentację roli BolekKB.
3. Uruchomić testową instancję.
4. Utworzyć kolekcje startowe.
5. Zaindeksować dokumentację repo Bolka.
6. Dodać narzędzia kb_* w BolekAI.
7. Dodać cytowanie źródeł w odpowiedziach.
8. Dopiero potem dodawać prywatniejsze dokumenty.
```

---

## 11. Definition of Done

Integracja jest gotowa, gdy:

- BolekKB działa jako osobny serwis,
- istnieją kolekcje startowe,
- dokumenty mają metadane,
- `BolekAI` potrafi wyszukać kontekst przez `kb_search`,
- wyniki zawierają źródła,
- Bolek potrafi odpowiedzieć na pytanie „na czym się opierasz?”.

---

## 12. Zasada końcowa

```txt
BolekKB jest biblioteką Bolka.
Biblioteka pomaga myśleć, ale nie podejmuje decyzji.
Decyzje, akcje i zgody zostają w BolekAI.
```