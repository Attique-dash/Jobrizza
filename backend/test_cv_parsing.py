#!/usr/bin/env python3
"""Test CV parsing to verify the fixes work correctly."""

import sys
sys.path.insert(0, '/Users/apple/Desktop/Vettor/backend')

from app import extract_text_from_pdf, parse_cv_data, analyze_cv_quality
import os

def test_cv_parsing(pdf_path):
    """Test CV parsing on a PDF file."""
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(pdf_path)}")
    print('='*60)
    
    # Extract text from PDF
    text = extract_text_from_pdf(pdf_path)
    print(f"\n📄 Extracted text (first 500 chars):\n{text[:500]}...")
    
    # Parse CV data
    cv_data = parse_cv_data(text, os.path.basename(pdf_path))
    
    print(f"\n📊 PARSED DATA:")
    print(f"  Name: {cv_data.get('name') or '❌ NOT FOUND'}")
    print(f"  Email: {cv_data.get('email') or '❌ NOT FOUND'}")
    print(f"  Phone: {cv_data.get('phone') or '❌ NOT FOUND'}")
    print(f"  Skills ({len(cv_data.get('skills', []))}): {', '.join(cv_data.get('skills', [])[:10]) or '❌ NONE'}")
    print(f"  Education ({len(cv_data.get('education', []))}): {cv_data.get('education', [])[:2] or '❌ NONE'}")
    print(f"  Experience ({len(cv_data.get('experience', []))}): {cv_data.get('experience', [])[:2] or '❌ NONE'}")
    
    # Analyze quality
    analysis = analyze_cv_quality(cv_data, text)
    print(f"\n📈 QUALITY ANALYSIS:")
    print(f"  Total Score: {analysis.get('score', 0)}%")
    print(f"  Mistakes: {analysis.get('mistakes', [])}")
    print(f"  Suggestions: {analysis.get('suggestions', [])}")
    
    return cv_data, analysis

if __name__ == "__main__":
    # Test with available CVs
    test_files = [
        "/Users/apple/Desktop/Vettor/backend/uploads/attique_cv.pdf",
        "/Users/apple/Desktop/Vettor/backend/uploads/My_CV.pdf",
        "/Users/apple/Desktop/Vettor/backend/uploads/web_developer_cv.pdf",
        "/Users/apple/Desktop/Vettor/backend/uploads/Screenshot_2026-04-23_at_7.25.49_PM.pdf",
    ]
    
    for pdf_file in test_files:
        if os.path.exists(pdf_file):
            try:
                test_cv_parsing(pdf_file)
            except Exception as e:
                print(f"\n❌ Error testing {pdf_file}: {e}")
        else:
            print(f"\n⚠️ File not found: {pdf_file}")
