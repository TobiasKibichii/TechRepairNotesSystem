import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

vec = joblib.load(os.path.join(BASE_DIR, "..", "triage_vectorizer.pkl"))
clf = joblib.load(os.path.join(BASE_DIR, "..", "smart_triage_clf.pkl"))

def classify(text):
    X = vec.transform([text])
    pred = clf.predict(X)[0]
    proba = max(clf.predict_proba(X)[0])
    return pred, float(proba)

if __name__ == "__main__":
    import sys
    text = " ".join(sys.argv[1:]) or "phone screen flickers after the drop"
    cat, conf = classify(text)
    print("Category:", cat, "Confidence:", conf)