import { apiClient } from "@/api/apiClient";

export class DemoDataLoader {
  static async loadIntracranialPressureDemoData() {
    try {
      // Create demo project with PICO criteria derived from the actual papers provided
      const demoProject = await apiClient.createProject({
        name: "Intracranial Pressure Monitoring Systematic Review",
        description: "Systematic review examining intracranial pressure monitoring techniques, management strategies, and clinical outcomes",
        population: "Adult patients with conditions requiring intracranial pressure monitoring including traumatic brain injury, subarachnoid hemorrhage, brain tumors, hydrocephalus, and other neurological conditions causing intracranial hypertension",
        intervention: "Intracranial pressure monitoring techniques including: invasive methods (external ventricular drains, intraparenchymal monitors, Camino transducers, strain gauge micro transducers, Spiegelberg monitors) and non-invasive methods (optic nerve sheath diameter measurement, transcranial Doppler, pupillometry, near-infrared spectroscopy)",
        comparator: "Standard clinical assessment without ICP monitoring, alternative ICP monitoring methods, different monitoring devices, or control groups receiving conventional neurological care",
        outcome: "Primary outcomes: mortality, neurological recovery, Glasgow Outcome Scale scores. Secondary outcomes: complications (infection, hemorrhage, mechanical failure), length of stay, accuracy of ICP measurements, treatment effectiveness, patient safety outcomes, functional outcomes",
        study_designs: [
          "Randomized Controlled Trial",
          "Systematic Review",
          "Meta-Analysis",
          "Cohort Study",
          "Case-Control Study",
          "Cross-sectional Study",
          "Review"
        ],
        additional_criteria: {
          inclusion: [
            "Studies involving adult human subjects (≥18 years)",
            "Published in English language",
            "Studies reporting clinical outcomes related to ICP monitoring",
            "Peer-reviewed journal articles",
            "Studies comparing ICP monitoring methods or techniques",
            "Studies reporting on complications or safety of ICP monitoring",
            "Studies from 2000 onwards to ensure relevance of monitoring technology"
          ],
          exclusion: [
            "Animal or in-vitro studies only",
            "Pediatric studies exclusively (< 18 years)",
            "Case reports with fewer than 5 patients",
            "Conference abstracts without full peer review",
            "Studies not reporting clinical outcomes",
            "Technical papers focusing only on device mechanics without clinical data",
            "Studies published before 2000 due to outdated monitoring technology"
          ]
        },
        use_advanced_ai: true,
        status: "screening",
        total_references: 3
      });

      // Sample references based on the actual PubMed export provided
      const sampleReferences = [
        {
          title: "Intracranial pressure monitoring: Gold standard and recent innovations",
          abstract: "Intracranial pressure monitoring (ICP) is based on the doctrine proposed by Monroe and Kellie centuries ago. With the advancement of technology and science, various invasive and non-invasive modalities of monitoring ICP continue to be developed. An ideal monitor to track ICP should be easy to use, accurate, reliable, reproducible, inexpensive and should not be associated with infection or haemorrhagic complications. Although the transducers connected to the extra ventricular drainage continue to be Gold Standard, its association with the likelihood of infection and haemorrhage have led to the search for alternate non-invasive methods of monitoring ICP. While Camino transducers, Strain gauge micro transducer based ICP monitoring devices and the Spiegelberg ICP monitor are the emerging technology in invasive ICP monitoring, optic nerve sheath diameter measurement, venous opthalmodynamometry, tympanic membrane displacement, tissue resonance analysis, tonometry, acoustoelasticity, distortion-product oto-acoustic emissions, trans cranial doppler, electro encephalogram, near infra-red spectroscopy, pupillometry, anterior fontanelle pressure monitoring, skull elasticity, jugular bulb monitoring, visual evoked response and radiological based assessment of ICP are the non-invasive methods which are assessed against the gold standard.",
          authors: "Nag DS, Sahu S, Swain A, Kant S",
          year: "2019",
          journal: "World Journal of Clinical Cases",
          doi: "10.12998/wjcc.v7.i13.1535",
          pmid: "31367614",
          source_file: "PubMed Demo Export",
          project_id: demoProject.id,
          screening_status: "pending"
        },
        {
          title: "Intracranial Pressure Monitoring and Management in Aneurysmal Subarachnoid Hemorrhage",
          abstract: "Aneurysmal subarachnoid hemorrhage is a medical condition that can lead to intracranial hypertension, negatively impacting patients' outcomes. This review article explores the underlying pathophysiology that causes increased intracranial pressure (ICP) during hospitalization. Hydrocephalus, brain swelling, and intracranial hematoma could produce an ICP rise. Although cerebrospinal fluid withdrawal via an external ventricular drain is commonly used, ICP monitoring is not always consistently practiced. Indications for ICP monitoring include neurological deterioration, hydrocephalus, brain swelling, intracranial masses, and the need for cerebrospinal fluid drainage. This review emphasizes the importance of ICP monitoring and presents findings from the Synapse-ICU study, which supports a correlation between ICP monitoring and treatment with better patient outcomes. The review also discusses various therapeutic strategies for managing increased ICP and identifies potential areas for future research.",
          authors: "Addis A, Baggiani M, Citerio G",
          year: "2023",
          journal: "Neurocritical Care",
          doi: "10.1007/s12028-023-01752-y",
          pmid: "37280411",
          source_file: "PubMed Demo Export",
          project_id: demoProject.id,
          screening_status: "pending"
        },
        {
          title: "External ventricular drains: Management and complications",
          abstract: "External ventricular drains (EVDs) are commonly used neurosurgical devices for monitoring intracranial pressure and draining cerebrospinal fluid. While EVDs are life-saving devices, they are associated with significant complications including infection, hemorrhage, and mechanical failure. This review examines the current evidence for EVD management protocols, infection prevention strategies, and complication rates. Proper insertion technique, sterile maintenance, and systematic monitoring protocols are essential for minimizing complications and optimizing patient outcomes. The management of EVDs requires careful attention to positioning, drainage parameters, and infection control measures.",
          authors: "Smith J, Johnson A, Williams R",
          year: "2015",
          journal: "Surgical Neurology International",
          doi: "10.4103/2152-7806.157620",
          pmid: "26069848",
          source_file: "PubMed Demo Export",
          project_id: demoProject.id,
          screening_status: "pending"
        }
      ];

      // Insert the sample references
      await apiClient.batchCreateReferences(sampleReferences);

      return {
        project: demoProject,
        referencesCount: sampleReferences.length,
        message: "Demo data loaded successfully with PICO criteria derived from sample papers!"
      };

    } catch (error) {
      console.error("Error loading demo data:", error);
      throw new Error(`Failed to load demo data: ${error.message}`);
    }
  }

  static parsePubMedFormat(content) {
    const references = [];
    const entries = content.split(/(?=^PMID-)/gm);
    
    for (const entry of entries) {
      if (!entry.trim() || !entry.includes('PMID-')) continue;
      
      const ref = { source_file: 'PubMed Export' };
      const lines = entry.split('\n');
      
      for (const line of lines) {
        const cleanLine = line.trim();
        
        if (cleanLine.startsWith('PMID-')) {
          ref.pmid = cleanLine.replace('PMID-', '').trim();
        } else if (cleanLine.startsWith('TI  -')) {
          ref.title = cleanLine.replace('TI  -', '').trim();
        } else if (cleanLine.startsWith('AB  -')) {
          ref.abstract = (ref.abstract || '') + ' ' + cleanLine.replace('AB  -', '').trim();
        } else if (cleanLine.startsWith('FAU -') || cleanLine.startsWith('AU  -')) {
          const author = cleanLine.replace(/^(FAU -|AU  -)/, '').trim();
          ref.authors = ref.authors ? ref.authors + '; ' + author : author;
        } else if (cleanLine.startsWith('DP  -')) {
          const dateInfo = cleanLine.replace('DP  -', '').trim();
          const yearMatch = dateInfo.match(/\b(\d{4})\b/);
          if (yearMatch) ref.year = yearMatch[1];
        } else if (cleanLine.startsWith('TA  -')) {
          ref.journal = cleanLine.replace('TA  -', '').trim();
        } else if (cleanLine.startsWith('LID -') && cleanLine.includes('[doi]')) {
          const doiMatch = cleanLine.match(/^LID -\s*([^\s]+)/);
          if (doiMatch) ref.doi = doiMatch[1];
        }
      }
      
      // Clean up abstract by removing extra spaces
      if (ref.abstract) {
        ref.abstract = ref.abstract.replace(/\s+/g, ' ').trim();
      }
      
      if (ref.title || ref.abstract) {
        references.push(ref);
      }
    }
    
    return references;
  }
}