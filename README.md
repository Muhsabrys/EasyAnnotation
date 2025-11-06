# EasyAnnotation

### A Framework for Multilingual Natural Language Inference Annotation

---

## 1. Introduction

**EasyAnnotation** is designed to facilitate the systematic annotation of *Natural Language Inference (NLI)* data across multiple languages.
The framework provides a structured environment for training annotators, ensuring conceptual clarity and consistency in annotation practices.

Natural Language Inference (NLI) is a foundational task in computational semantics that assesses the **logical relationship between two textual segments**: a *premise* and a *hypothesis*.
The goal is to determine whether the hypothesis is logically entailed by, contradicts, or is neutral with respect to the premise.

> **Relevance of NLI:**
> The task is central to numerous natural language understanding applications such as automatic fact verification, question answering, text summarization, and dialogue modeling.
> A reliable grasp of inference relations enables language models to reason coherently across domains.

---

## 2. Conceptual Framework

### 2.1 The Two-Sentence Structure

| Component          | Definition                                                                  |
| ------------------ | --------------------------------------------------------------------------- |
| **Premise (P)**    | The statement accepted as true and used as the factual basis for reasoning. |
| **Hypothesis (H)** | The statement whose logical status is evaluated relative to the premise.    |

### 2.2 Relationship Types

Each pair (P, H) is categorized into one of four inferential relations:

| Relation          | Definition                                                        | Logical Interpretation                                                  |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Entailment**    | The hypothesis is a necessary logical consequence of the premise. | If P is true, then H must be true.                                      |
| **Contradiction** | The hypothesis is incompatible with the premise.                  | If P is true, then H must be false.                                     |
| **Neutral**       | The truth of the hypothesis cannot be inferred from the premise.  | The information in P is insufficient to determine the truth value of H. |
| **Nonsense**      | The hypothesis is ill-formed or semantically incoherent.          | Logical evaluation is not possible.                                     |

---

## 3. Illustrative Examples

### 3.1 Basic Inference Relations

| Premise                                     | Hypothesis                                           | Relation          | Explanation                                                          |
| ------------------------------------------- | ---------------------------------------------------- | ----------------- | -------------------------------------------------------------------- |
| The museum closes at 6 PM every weekday.    | Visitors cannot enter the museum at 7 PM on Tuesday. | **Entailment**    | Temporal entailment: closure at 6 PM implies unavailability at 7 PM. |
| Sarah has been a vegetarian for five years. | Sarah ate meat yesterday.                            | **Contradiction** | Violates the definition of vegetarianism.                            |
| The company hired ten software engineers.   | The company’s revenue increased this quarter.        | **Neutral**       | Hiring does not necessarily entail revenue growth.                   |

### 3.2 Intermediate-Level Reasoning

| Premise                                                  | Hypothesis                                 | Relation          | Explanation                                             |
| -------------------------------------------------------- | ------------------------------------------ | ----------------- | ------------------------------------------------------- |
| All participants were aged between 18 and 25.            | No minors participated in the study.       | **Entailment**    | Participants aged ≥18 excludes minors by definition.    |
| The medication should be taken twice daily with food.    | It should be taken on an empty stomach.    | **Contradiction** | The two prescriptions are mutually exclusive.           |
| The experiment was conducted in a controlled laboratory. | The findings apply to real-world settings. | **Neutral**       | External validity is not guaranteed by laboratory data. |

### 3.3 Complex and Edge Cases

| Premise                                      | Hypothesis                        | Relation       | Explanation                                             |
| -------------------------------------------- | --------------------------------- | -------------- | ------------------------------------------------------- |
| Either John or Mary will attend the meeting. | John will attend the meeting.     | **Neutral**    | The disjunction does not entail a specific participant. |
| The temperature dropped below freezing.      | Water outdoors would have frozen. | **Entailment** | Based on the freezing point of water.                   |
| The restaurant serves Italian cuisine.       | Sushi is available there.         | **Neutral**    | The premise does not specify exclusivity.               |

---

## 4. Multilingual Demonstrations

### 4.1 German (Deutsch)

| Premise                                    | Hypothesis                           | Relation          |
| ------------------------------------------ | ------------------------------------ | ----------------- |
| Der Zug fährt jeden Morgen um 7:30 Uhr ab. | Man kann um 7:45 Uhr einsteigen.     | **Contradiction** |
| Die Bibliothek hat über 100.000 Bücher.    | Die Bibliothek ist gut ausgestattet. | **Entailment**    |
| Das Konzert wurde wegen Regen verschoben.  | Die Band war krank.                  | **Neutral**       |

### 4.2 Arabic (العربية)

| الجملة الأصلية                                 | الافتراض                         | العلاقة                   |
| ---------------------------------------------- | -------------------------------- | ------------------------- |
| الطبيب نصح المريض بالراحة التامة لمدة أسبوعين. | يجب على المريض تجنب العمل الشاق. | **تضمين (Entailment)**    |
| جميع المتاجر مغلقة يوم الجمعة.                 | يمكنك التسوق يوم الجمعة.         | **تناقض (Contradiction)** |
| الطالب يدرس الهندسة في الجامعة.                | الطالب يجيد الرياضيات.           | **محايد (Neutral)**       |

### 4.3 Spanish (Español)

| Premisa                                     | Hipótesis                                       | Relación          |
| ------------------------------------------- | ----------------------------------------------- | ----------------- |
| La conferencia comienza a las 9:00.         | Si llegas a las 9:15, habrás perdido el inicio. | **Entailment**    |
| María es alérgica a los frutos secos.       | María puede comer almendras.                    | **Contradiction** |
| El restaurante tiene una estrella Michelin. | La comida es cara.                              | **Neutral**       |

### 4.4 Portuguese (Português)

| Premissa                           | Hipótese                 | Relação           |
| ---------------------------------- | ------------------------ | ----------------- |
| Todos os alunos passaram no exame. | Nenhum aluno reprovou.   | **Entailment**    |
| O voo decola às 14h.               | O voo já decolou às 13h. | **Contradiction** |
| A empresa lançou um novo produto.  | As vendas vão aumentar.  | **Neutral**       |

### 4.5 Chinese (中文)

| 前提              | 假设           | 关系                     |
| --------------- | ------------ | ---------------------- |
| 这家商店每天营业到晚上10点。 | 你可以在晚上11点购物。 | **矛盾 (Contradiction)** |
| 所有参赛者都必须年满18岁。  | 未成年人不能参加比赛。  | **蕴含 (Entailment)**    |
| 这部电影获得奥斯卡奖。     | 每个人都喜欢这部电影。  | **中性 (Neutral)**       |

---

## 5. Annotation Access Protocol

Each annotator receives a **unique access code** corresponding to the language and dataset assigned.
These codes ensure controlled data access, contributor accountability, and traceability of annotations.
Distribution of access credentials is managed by the project’s coordination team.
