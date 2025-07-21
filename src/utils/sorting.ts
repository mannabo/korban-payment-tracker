import { Group } from '../types';

export const sortGroups = (groups: Group[]): Group[] => {
  return groups.sort((a, b) => {
    // Extract numbers from group names for better sorting
    const getNumericValue = (name: string): number => {
      const match = name.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const aNum = getNumericValue(a.name);
    const bNum = getNumericValue(b.name);
    
    // If both have numbers, sort numerically
    if (aNum && bNum) {
      return aNum - bNum;
    }
    
    // Otherwise, sort alphabetically
    return a.name.localeCompare(b.name);
  });
};

// More advanced sorting that handles various naming patterns
export const smartSortGroups = (groups: Group[]): Group[] => {
  return groups.sort((a, b) => {
    // Normalize names for comparison
    const normalizeGroupName = (name: string): { prefix: string; number: number; suffix: string } => {
      // Match patterns like "Kumpulan 1", "Group 10", "Team A1", etc.
      const match = name.match(/^(.*?)(\d+)(.*)$/);
      
      if (match) {
        return {
          prefix: match[1].trim(),
          number: parseInt(match[2]),
          suffix: match[3].trim()
        };
      }
      
      return {
        prefix: name,
        number: 0,
        suffix: ''
      };
    };
    
    const aParts = normalizeGroupName(a.name);
    const bParts = normalizeGroupName(b.name);
    
    // First sort by prefix
    const prefixCompare = aParts.prefix.localeCompare(bParts.prefix);
    if (prefixCompare !== 0) {
      return prefixCompare;
    }
    
    // Then by number
    const numberCompare = aParts.number - bParts.number;
    if (numberCompare !== 0) {
      return numberCompare;
    }
    
    // Finally by suffix
    return aParts.suffix.localeCompare(bParts.suffix);
  });
};