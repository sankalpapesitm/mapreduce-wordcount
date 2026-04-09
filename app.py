from flask import Flask, render_template, request, jsonify, send_file
import re
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import io
import base64
import PyPDF2
import docx
import os

app = Flask(__name__)

STOP_WORDS = {"the","is","a","an","in","on","at","to","for","of","and","or","with","by","as"}

# -------- MAP --------
def map_function(chunk):
    words = re.findall(r'\b\w+\b', chunk.lower())
    return [(word, 1) for word in words if word not in STOP_WORDS]

# -------- REDUCE --------
def reduce_function(mapped):
    result = {}
    for word, count in mapped:
        result[word] = result.get(word, 0) + count
    return result

# -------- REAL MAPREDUCE (Chunking) --------
def mapreduce(text, chunk_size=50):
    words = text.split()
    chunks = [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

    mapped_all = []
    for chunk in chunks:
        mapped_all.extend(map_function(chunk))

    reduced = reduce_function(mapped_all)

    sorted_result = dict(sorted(reduced.items(), key=lambda x: x[1], reverse=True))

    return mapped_all[:50], sorted_result

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    text = request.form.get('text', '')

    file = request.files.get('file')
    if file:
        filename = file.filename.lower()
        if filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += " " + extracted
        elif filename.endswith('.docx'):
            doc_reader = docx.Document(file)
            for para in doc_reader.paragraphs:
                text += " " + para.text
        else:
            text += " " + file.read().decode('utf-8', errors='ignore')

    mapped, reduced = mapreduce(text)

    return jsonify({"mapped": mapped, "reduced": reduced})

# -------- PDF DOWNLOAD --------
@app.route('/download/pdf', methods=['POST'])
def download_pdf():
    req_data = request.json
    word_data = req_data.get('frequencies', {})
    chart_image_b64 = req_data.get('chart_image', '')

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer)
    styles = getSampleStyleSheet()

    content = []

    # Add Document Title
    content.append(Paragraph("MapReduce Word Analysis Report", styles['Title']))
    content.append(Spacer(1, 12))

    # Process and Add Chart Image
    if chart_image_b64:
        try:
            header, encoded = chart_image_b64.split(",", 1)
            image_data = base64.b64decode(encoded)
            img_io = io.BytesIO(image_data)
            img = Image(img_io, width=420, height=210)
            content.append(img)
            content.append(Spacer(1, 24))
        except Exception as e:
            pass  # Fail gracefully without the chart if conversion fails

    # Add Table Heading
    content.append(Paragraph("Word Frequency Distribution", styles['Heading2']))
    content.append(Spacer(1, 12))

    # Format Data into a Table Structure
    sorted_data = sorted(word_data.items(), key=lambda x: x[1], reverse=True)
    table_data = [["Word", "Count"]] # Table Headers
    for word, count in sorted_data:
        table_data.append([word, str(count)])

    # Create and perfectly align the Table
    t = Table(table_data, colWidths=[200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1d2671")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 12),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f4f4f9")),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.black),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#dddddd"))
    ]))
    content.append(t)

    doc.build(content)
    buffer.seek(0)

    return send_file(buffer,
                     mimetype="application/pdf",
                     as_attachment=True,
                     download_name="result.pdf")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))