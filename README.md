# 🎯 EasyAnnotation

**Master Natural Language Inference (NLI) Annotation with Interactive Learning**

---

## 🧠 Understanding Natural Language Inference (NLI)

**Natural Language Inference (NLI)** evaluates the logical relationship between two statements — a *premise* and a *hypothesis*.
It tests whether a model can understand implications, contradictions, and neutral relationships that humans naturally recognize.

> **Why NLI Matters:**
> NLI is central to fact-checking, question answering, reading comprehension, and dialogue systems.
> A system that understands entailment can reason logically about text.

### 🧩 Two-Sentence Structure

| Component           | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| **Premise (📌)**    | The foundational statement assumed to be true. It provides the factual context. |
| **Hypothesis (🔍)** | The statement whose relation to the premise is being evaluated.                 |

### 🔍 The Four Relationship Categories

| Label               | Meaning                                                              | Example Explanation                 |
| ------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| ✅ **Entailment**    | The hypothesis **logically follows** from the premise.               | “This is a logical consequence.”    |
| ❌ **Contradiction** | The hypothesis **conflicts** with the premise.                       | “These cannot both be true.”        |
| ➖ **Neutral**       | The hypothesis **may or may not** be true; insufficient information. | “Could be true, but we don’t know.” |
| ⚠️ **Nonsense**     | The hypothesis is **incoherent or ungrammatical**.                   | “This doesn’t make sense.”          |

---

## 💡 Sample Examples

### **Example Set 1: Basic Logical Inference**

| Premise                                     | Hypothesis                                      | Label           | Explanation                                 |
| ------------------------------------------- | ----------------------------------------------- | --------------- | ------------------------------------------- |
| The museum closes at 6 PM every weekday.    | You cannot visit the museum at 7 PM on Tuesday. | ✅ Entailment    | Tuesday is a weekday; after 6 PM is closed. |
| Sarah has been a vegetarian for five years. | Sarah ate a steak yesterday.                    | ❌ Contradiction | Vegetarians don’t eat meat.                 |
| The company hired 10 new engineers.         | The company’s revenue increased this quarter.   | ➖ Neutral       | Hiring doesn’t guarantee higher revenue.    |

### **Example Set 2: Nuanced Reasoning**

| Premise                                         | Hypothesis                                    | Label           | Explanation                        |
| ----------------------------------------------- | --------------------------------------------- | --------------- | ---------------------------------- |
| All participants were between 18 and 25.        | No minors participated in the study.          | ✅ Entailment    | All are 18+, so no minors.         |
| Medicine should be taken twice daily with food. | Taking it on an empty stomach is recommended. | ❌ Contradiction | Opposite instructions.             |
| Experiment was in a controlled lab.             | Results apply to real-world settings.         | ➖ Neutral       | Need more data for generalization. |

### **Example Set 3: Edge Cases**

| Premise                                 | Hypothesis                                     | Label        | Explanation                |
| --------------------------------------- | ---------------------------------------------- | ------------ | -------------------------- |
| Either John or Mary will attend.        | John will attend.                              | ➖ Neutral    | Could be either, not sure. |
| The temperature dropped below freezing. | Water in outdoor containers would have frozen. | ✅ Entailment | Physics-based entailment.  |
| The restaurant serves Italian cuisine.  | You can order sushi there.                     | ➖ Neutral    | Possible but not certain.  |

---

## 🌍 Multilingual NLI Examples

### 🇩🇪 **Deutsch (German)**

| Premise                                    | Hypothesis                           | Label              |
| ------------------------------------------ | ------------------------------------ | ------------------ |
| Der Zug fährt jeden Morgen um 7:30 Uhr ab. | Man kann um 7:45 Uhr einsteigen.     | ❌ Widerspruch      |
| Die Bibliothek hat über 100.000 Bücher.    | Die Bibliothek ist gut ausgestattet. | ✅ Schlussfolgerung |
| Das Konzert wurde wegen Regen verschoben.  | Die Band war krank.                  | ➖ Neutral          |

---

### 🇸🇦 **العربية (Arabic)**

| الجملة الأصلية                          | الافتراض                         | التصنيف |
| --------------------------------------- | -------------------------------- | ------- |
| الطبيب نصح المريض بالراحة لمدة أسبوعين. | يجب على المريض تجنب العمل الشاق. | ✅ تضمين |
| جميع المتاجر مغلقة يوم الجمعة.          | يمكنك التسوق يوم الجمعة.         | ❌ تناقض |
| الطالب يدرس الهندسة في الجامعة.         | الطالب يجيد الرياضيات.           | ➖ محايد |

---

### 🇪🇸 **Español (Spanish)**

| Premisa                                     | Hipótesis                                       | Etiqueta        |
| ------------------------------------------- | ----------------------------------------------- | --------------- |
| La conferencia comienza a las 9:00.         | Si llegas a las 9:15, habrás perdido el inicio. | ✅ Implicación   |
| María es alérgica a los frutos secos.       | María puede comer almendras.                    | ❌ Contradicción |
| El restaurante tiene una estrella Michelin. | La comida es cara.                              | ➖ Neutral       |

---

### 🇧🇷 **Português (Portuguese)**

| Premissa                           | Hipótese                 | Etiqueta      |
| ---------------------------------- | ------------------------ | ------------- |
| Todos os alunos passaram no exame. | Nenhum aluno reprovou.   | ✅ Implicação  |
| O voo decola às 14h.               | O voo já decolou às 13h. | ❌ Contradição |
| A empresa lançou um novo produto.  | As vendas vão aumentar.  | ➖ Neutro      |

---

### 🇨🇳 **中文 (Chinese)**

| 前提              | 假设           | 关系   |
| --------------- | ------------ | ---- |
| 这家商店每天营业到晚上10点。 | 你可以在晚上11点购物。 | ❌ 矛盾 |
| 所有参赛者都必须年满18岁。  | 未成年人不能参加比赛。  | ✅ 蕴含 |
| 这部电影获得奥斯卡奖。     | 每个人都喜欢这部电影。  | ➖ 中性 |

---

## 🔑 Annotation Access

Each annotator receives a **language-specific access code** for their assigned dataset.
Codes ensure correct language mapping and secure contribution tracking.
Access codes are distributed directly by the project coordinator.
