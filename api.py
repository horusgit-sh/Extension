from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
import deepl
import requests
DATABASE_URL = "postgresql+psycopg2://postgres:eJJs-j9vS5ip-TPb-Hv@localhost:5432/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Word(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, index=True)
    translation = Column(String)
    explanation = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI()

class WordIn(BaseModel):
    word: str
    translation: str
    explanation: str

@app.post("/save_word")
def save_word(word_in: WordIn):
    db = SessionLocal()
    existing_word = db.query(Word).filter(Word.word == word_in.word).first()
    if existing_word:
        db.close()
        raise HTTPException(status_code=400, detail="Word already exist in db!")
    db_word = Word(
        word=word_in.word,
        translation=translate(word_in.word),
        explanation=get_meaning(word_in.word)
    )
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    db.close()
    return {"status": "ok"}

@app.get("/dictionary")
def get_meaning(word: str = Query(..., description="Word for search")):
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Can't find this word!")

    data = response.json()

    definitions = []
    for meaning in data[0].get("meanings", []):
        for d in meaning.get("definitions", []):
            definitions.append({
                "definition": d.get("definition")
            })

    return {
        "definitions": definitions
    }


@app.get("/get_word")
def get_word(word: str = Query(..., description="Word for search")):
    db = SessionLocal()
    existing_word = db.query(Word).filter(Word.word == word).first()
    db.close()
    if existing_word:
        return {
            "word": existing_word.word,
            "translation": existing_word.translation,
            "explanation": existing_word.explanation
        }
    else:
        raise HTTPException(status_code=404, detail="Can't find this word!")


@app.get("/translate")
def translate(word: str = Query(..., description="Word for translate")):
    key = "11d61b59-a98b-4727-9f58-98b04e946dba:fx"
    translator = deepl.Translator(key)
    result = translator.translate_text(word, target_lang="RU")
    if result:
        return result
    else:
        return {"status":"False"}



@app.get("/words")
def get_words():
    db = SessionLocal()
    words = db.query(Word).all()
    db.close()
    return [
        {
            "id": w.id,
            "word": w.word,
            "translation": w.translation,
            "explanation": w.explanation
        }
        for w in words
    ]
