#!/bin/bash

# Directories to search
DIRECTORIES=(
  "src/pages/Screening.jsx"
  "src/pages/DualReview.jsx"
  "src/components/ai/ProcessingQueue.jsx"
  "src/components/ai/DualAIScreener.jsx"
)

# Replacement function
replace_references() {
    
  local file="$1"
  
  # Backup original file
  cp "$file" "$file.bak"
  
  # Replace import statements
  sed -i 's/import {
     Reference 
} from '\''@\/api\/entities'\'';
/import {
     apiClient 
} from '\''@\/api\/apiClient'\'';
/g' "$file"
  
  # Replace Reference.filter calls
  sed -i 's/Reference\.filter(/apiClient.filterReferences(/g' "$file"
  
  # Replace Reference.update calls
  sed -i 's/Reference\.update(/apiClient.updateReference(/g' "$file"

}

# Iterate and replace in each file
for file in "${
    DIRECTORIES[@]
}";
 do
  if [ -f "$file" ];
 then
    replace_references "$file"
    echo "Updated $file"
  else
    echo "Warning: $file not found"
  fi
done

echo "Code migration completed. Backup files created with .bak extension."