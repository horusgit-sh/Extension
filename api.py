from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException

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
        translation=word_in.translation,
        explanation=word_in.explanation
    )
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    db.close()
    return {"status": "ok", "id": db_word.id}

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
