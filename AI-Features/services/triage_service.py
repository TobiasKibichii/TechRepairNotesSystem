import joblib
from transformers import T5ForConditionalGeneration, T5TokenizerFast
from pydantic import BaseModel

# Pydantic model for request
class Req(BaseModel):
    title: str
    description: str

# Load ML models
vec = joblib.load("triage_vectorizer.pkl")
clf = joblib.load("smart_triage_clf.pkl")

# Load T5 model from Hugging Face
print("Loading T5 model from Hugging Face...")
t5_tokenizer = T5TokenizerFast.from_pretrained("evolving8/technotes_model")
t5_model = T5ForConditionalGeneration.from_pretrained("evolving8/technotes_model")
print("T5 loaded successfully")

# Logic function
def triage_logic(title: str, description: str):
    text = f"{title} {description}"
    X = vec.transform([text])
    cat = clf.predict(X)[0]
    conf = float(max(clf.predict_proba(X)[0]))

    cause = ""
    if t5_model:
        input_text = f"Classify and suggest cause: Title: {title} | Description: {description}"
        inputs = t5_tokenizer(input_text, return_tensors="pt", truncation=True, padding=True)
        out = t5_model.generate(**inputs, max_new_tokens=60)
        out_text = t5_tokenizer.decode(out[0], skip_special_tokens=True)

        if "||" in out_text:
            _, cause = out_text.split("||", 1)
            cause = cause.replace("Cause:", "").strip()

    return {
        "category": cat,
        "confidence": conf,
        "possible_cause": cause
    }