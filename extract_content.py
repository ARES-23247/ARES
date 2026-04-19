import sys

def extract_doc_content(file_path, slug):
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if slug in line:
                return line
    return None

if __name__ == "__main__":
    content = extract_doc_content(r'c:\Users\david\dev\robotics\ftc\ARESWEB\docs-seed-fixed.sql', 'interactive-java-basics-quiz')
    if content:
        print(content)
    else:
        print("Not found")
