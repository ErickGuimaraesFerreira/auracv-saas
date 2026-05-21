import os
from pypdf import PdfReader
from docx import Document

def extract_text_from_pdf(file_path: str) -> str:
    """Extrai texto brutas de um arquivo PDF."""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Erro ao extrair texto do PDF: {str(e)}")

def extract_text_from_docx(file_path: str) -> str:
    """Extrai texto brutos de um arquivo DOCX."""
    try:
        doc = Document(file_path)
        text = []
        for paragraph in doc.paragraphs:
            if paragraph.text:
                text.append(paragraph.text)
        return "\n".join(text).strip()
    except Exception as e:
        raise ValueError(f"Erro ao extrair texto do DOCX: {str(e)}")

def parse_resume(file_path: str) -> str:
    """Detecta a extensão do arquivo e extrai seu conteúdo em texto."""
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    else:
        raise ValueError(f"Formato de arquivo não suportado: {ext}. Envie PDF ou DOCX.")
