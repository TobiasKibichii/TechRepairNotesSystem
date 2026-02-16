from transformers import T5ForConditionalGeneration, T5TokenizerFast

# Load model from Hugging Face (not local folder)
model = T5ForConditionalGeneration.from_pretrained("evolving8/technotes_model")
tokenizer = T5TokenizerFast.from_pretrained("evolving8/technotes_model")

def predict_pair(title, description, max_new_tokens=60):
    input_text = f"Classify and suggest cause: Title: {title} | Description: {description}"
    inputs = tokenizer(input_text, return_tensors="pt", truncation=True, padding=True)
    outputs = model.generate(**inputs, max_new_tokens=max_new_tokens)
    out = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Expected format: "Category: <cat> || Cause: <cause>"
    if "||" in out:
        cat, cause = out.split("||", 1)
        cat = cat.replace("Category:", "").strip()
        cause = cause.replace("Cause:", "").strip()
    else:
        cat = out
        cause = ""

    return {"category": cat, "possible_cause": cause}

if __name__ == "__main__":
    print(predict_pair("Phone won't charge", "Charger connected but no response"))