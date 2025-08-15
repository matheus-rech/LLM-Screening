export class FileParser {
  static async parseFile(file) {
    const content = await this.readFileContent(file);
    const filename = file.name.toLowerCase();
    
    try {
      if (filename.endsWith('.csv')) {
        return this.parseCSV(content);
      } else if (filename.endsWith('.ris') || content.includes('TY  -')) {
        return this.parseRIS(content);
      } else if (filename.endsWith('.bib') || content.includes('@article') || content.includes('@inproceedings')) {
        return this.parseBibTeX(content);
      } else if (filename.endsWith('.xml') || content.includes('<PubmedArticle>') || content.includes('<record>')) {
        return this.parseXML(content);
      } else {
        throw new Error(`Unsupported file format: ${filename}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  static readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'utf-8');
    });
  }

  static parseCSV(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
      }

      // Parse header and normalize column names
      const headers = this.parseCSVLine(lines[0]).map(h => this.normalizeHeader(h.trim()));
      console.log('Detected CSV headers:', headers); // Debug log
      
      // Parse data rows
      const references = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === 0 || values.every(v => !v.trim())) continue;
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });

        // Create reference with flexible field mapping
        const reference = this.mapRowToReference(row, 'CSV Import');
        
        // Only include rows that have some meaningful content
        if (reference.title || reference.abstract || reference.authors) {
          references.push(reference);
        }
      }

      console.log(`Parsed ${references.length} references from CSV`); // Debug log

      if (references.length === 0) {
        throw new Error('No valid references found in CSV file. Please ensure your file has columns like Title, Abstract, Authors, etc.');
      }

      return references;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  static normalizeHeader(header) {
    const normalized = header.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    // Map common variations to standard names
    const headerMappings = {
      'article_title': 'title',
      'paper_title': 'title',
      'publication_title': 'title',
      'study_title': 'title',
      'citation_title': 'title',
      'item_title': 'title',
      'ti': 'title',
      't1': 'title',
      
      'abstract_summary': 'abstract',
      'summary': 'abstract',
      'description': 'abstract',
      'ab': 'abstract',
      'n2': 'abstract',
      
      'author_names': 'authors',
      'author': 'authors',
      'first_author': 'authors',
      'au': 'authors',
      'a1': 'authors',
      
      'publication_year': 'year',
      'pub_year': 'year',
      'date': 'year',
      'py': 'year',
      'y1': 'year',
      
      'journal_title': 'journal',
      'publication': 'journal',
      'source': 'journal',
      'jo': 'journal',
      't2': 'journal',
      'jf': 'journal',
      
      'digital_object_identifier': 'doi',
      'do': 'doi',
      'dx_doi_org': 'doi',
      
      'pubmed_id': 'pmid',
      'pm': 'pmid',
      'pmcid': 'pmid',
      'id': 'pmid'
    };

    return headerMappings[normalized] || normalized;
  }

  static mapRowToReference(row, sourceFile) {
    // Try multiple possible field names for each attribute
    const getField = (possibleNames) => {
      for (const name of possibleNames) {
        if (row[name] && row[name].trim()) {
          return this.cleanText(row[name]);
        }
      }
      return '';
    };

    return {
      title: getField(['title', 'article_title', 'paper_title', 'publication_title', 'study_title', 'ti', 't1']),
      abstract: getField(['abstract', 'abstract_summary', 'summary', 'description', 'ab', 'n2']),
      authors: getField(['authors', 'author_names', 'author', 'first_author', 'au', 'a1']),
      year: this.extractYear(getField(['year', 'publication_year', 'pub_year', 'date', 'py', 'y1'])),
      journal: getField(['journal', 'journal_title', 'publication', 'source', 'jo', 't2', 'jf']),
      doi: getField(['doi', 'digital_object_identifier', 'do', 'dx_doi_org']),
      pmid: getField(['pmid', 'pubmed_id', 'pm', 'pmcid', 'id']),
      source_file: sourceFile
    };
  }

  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.filter(item => item !== undefined);
  }

  static parseRIS(content) {
    const references = [];
    const entries = content.split(/(?=^TY\s+-)/gm);
    
    for (const entry of entries) {
      if (!entry.trim()) continue;
      
      const ref = { source_file: 'RIS Import' };
      const lines = entry.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^([A-Z]{1,2})\s+-\s+(.*)$/);
        if (!match) continue;
        
        const [, tag, value] = match;
        const cleanValue = this.cleanText(value);
        
        switch(tag) {
          case 'TI':
            ref.title = cleanValue;
            break;
          case 'AB':
            ref.abstract = (ref.abstract || '') + ' ' + cleanValue;
            break;
          case 'AU':
            ref.authors = ref.authors ? ref.authors + '; ' + cleanValue : cleanValue;
            break;
          case 'PY':
          case 'Y1':
            ref.year = this.extractYear(cleanValue);
            break;
          case 'JO':
          case 'JF':
          case 'T2':
            ref.journal = cleanValue;
            break;
          case 'DO':
            ref.doi = cleanValue;
            break;
          case 'AN':
            if (cleanValue.includes('PMID')) {
              ref.pmid = cleanValue.replace(/PMID:?\s*/, '');
            }
            break;
        }
      }
      
      if (ref.title || ref.abstract) {
        ref.abstract = ref.abstract?.trim();
        references.push(ref);
      }
    }
    
    if (references.length === 0) {
      throw new Error('No valid references found in RIS file');
    }
    
    return references;
  }

  static parseBibTeX(content) {
    const references = [];
    const entries = content.match(/@\w+\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g) || [];
    
    for (const entry of entries) {
      const ref = { source_file: 'BibTeX Import' };
      
      // Extract title
      const titleMatch = entry.match(/title\s*=\s*\{([^}]+)\}/i);
      if (titleMatch) ref.title = this.cleanText(titleMatch[1]);
      
      // Extract abstract
      const abstractMatch = entry.match(/abstract\s*=\s*\{([^}]+)\}/i);
      if (abstractMatch) ref.abstract = this.cleanText(abstractMatch[1]);
      
      // Extract authors
      const authorMatch = entry.match(/author\s*=\s*\{([^}]+)\}/i);
      if (authorMatch) ref.authors = this.cleanText(authorMatch[1]);
      
      // Extract year
      const yearMatch = entry.match(/year\s*=\s*\{?(\d{4})\}?/i);
      if (yearMatch) ref.year = yearMatch[1];
      
      // Extract journal
      const journalMatch = entry.match(/journal\s*=\s*\{([^}]+)\}/i);
      if (journalMatch) ref.journal = this.cleanText(journalMatch[1]);
      
      // Extract DOI
      const doiMatch = entry.match(/doi\s*=\s*\{([^}]+)\}/i);
      if (doiMatch) ref.doi = this.cleanText(doiMatch[1]);
      
      if (ref.title || ref.abstract) {
        references.push(ref);
      }
    }
    
    if (references.length === 0) {
      throw new Error('No valid references found in BibTeX file');
    }
    
    return references;
  }

  static parseXML(content) {
    const references = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    
    // Handle PubMed XML format
    const articles = doc.querySelectorAll('PubmedArticle, Article, record');
    
    for (const article of articles) {
      const ref = { source_file: 'XML Import' };
      
      // Extract title
      const titleEl = article.querySelector('ArticleTitle, article-title, title');
      if (titleEl) ref.title = this.cleanText(titleEl.textContent);
      
      // Extract abstract
      const abstractEl = article.querySelector('Abstract AbstractText, abstract, description');
      if (abstractEl) ref.abstract = this.cleanText(abstractEl.textContent);
      
      // Extract authors
      const authors = Array.from(article.querySelectorAll('Author, author, creator'));
      if (authors.length > 0) {
        ref.authors = authors.map(author => {
          const lastName = author.querySelector('LastName, family-name')?.textContent || '';
          const foreName = author.querySelector('ForeName, given-names')?.textContent || '';
          return `${lastName}, ${foreName}`.trim().replace(/,$/, '');
        }).join('; ');
      }
      
      // Extract year
      const yearEl = article.querySelector('PubDate Year, pub-date year, date');
      if (yearEl) ref.year = this.extractYear(yearEl.textContent);
      
      // Extract journal
      const journalEl = article.querySelector('Journal Title, journal-title, source');
      if (journalEl) ref.journal = this.cleanText(journalEl.textContent);
      
      // Extract PMID
      const pmidEl = article.querySelector('PMID, pmid');
      if (pmidEl) ref.pmid = this.cleanText(pmidEl.textContent);
      
      // Extract DOI
      const doiEl = article.querySelector('[IdType="doi"], doi');
      if (doiEl) ref.doi = this.cleanText(doiEl.textContent);
      
      if (ref.title || ref.abstract) {
        references.push(ref);
      }
    }
    
    if (references.length === 0) {
      throw new Error('No valid references found in XML file');
    }
    
    return references;
  }

  static cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/[{}]/g, '')
      .trim();
  }

  static extractYear(text) {
    if (!text) return '';
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : text.slice(0, 4);
  }
}