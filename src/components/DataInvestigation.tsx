import React, { useState } from 'react';
import { getGroups, getAllParticipants } from '../utils/firestore';
import { Group, Participant } from '../types';

interface InvestigationResult {
  groups: Group[];
  participants: Participant[];
  groupParticipantCounts: { [groupId: string]: number };
  orphanedParticipants: Participant[];
  duplicates: Array<{
    name: string;
    groupId: string;
    ids: string[];
  }>;
  totalGroups: number;
  totalParticipants: number;
  expectedParticipants: number;
  discrepancy: number;
}

const DataInvestigation: React.FC = () => {
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runInvestigation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting data investigation...');
      
      // 1. Get all groups
      const groups = await getGroups();
      console.log(`Found ${groups.length} groups`);
      
      // 2. Get all participants
      const participants = await getAllParticipants();
      console.log(`Found ${participants.length} participants`);
      
      // 3. Count participants per group
      const groupParticipantCounts: { [groupId: string]: number } = {};
      groups.forEach(group => {
        const participantsInGroup = participants.filter(p => p.groupId === group.id);
        groupParticipantCounts[group.id] = participantsInGroup.length;
      });
      
      // 4. Find orphaned participants
      const groupIds = new Set(groups.map(g => g.id));
      const orphanedParticipants = participants.filter(p => !groupIds.has(p.groupId));
      
      // 5. Find duplicates
      const participantNames: { [key: string]: Participant } = {};
      const duplicates: Array<{ name: string; groupId: string; ids: string[] }> = [];
      
      participants.forEach(p => {
        const key = `${p.name}_${p.groupId}`;
        if (participantNames[key]) {
          // Check if we already have this duplicate recorded
          const existingDup = duplicates.find(d => d.name === p.name && d.groupId === p.groupId);
          if (existingDup) {
            existingDup.ids.push(p.id);
          } else {
            duplicates.push({
              name: p.name,
              groupId: p.groupId,
              ids: [participantNames[key].id, p.id]
            });
          }
        } else {
          participantNames[key] = p;
        }
      });
      
      const expectedParticipants = groups.length * 7;
      const discrepancy = participants.length - expectedParticipants;
      
      const investigationResult: InvestigationResult = {
        groups,
        participants,
        groupParticipantCounts,
        orphanedParticipants,
        duplicates,
        totalGroups: groups.length,
        totalParticipants: participants.length,
        expectedParticipants,
        discrepancy
      };
      
      setResult(investigationResult);
      
      // Also log to console for detailed analysis
      console.log('📊 INVESTIGATION RESULTS:');
      console.log('Groups:', groups);
      console.log('Participants:', participants);
      console.log('Group participant counts:', groupParticipantCounts);
      console.log('Orphaned participants:', orphanedParticipants);
      console.log('Duplicates:', duplicates);
      
    } catch (err) {
      console.error('Investigation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Data Investigation Tool</h2>
      <p className="text-gray-600 mb-4">
        This tool will analyze the database to identify data discrepancies.
      </p>
      
      <button
        onClick={runInvestigation}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Investigating...' : 'Run Investigation'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total Groups: {result.totalGroups}</div>
              <div>Total Participants: {result.totalParticipants}</div>
              <div>Expected Participants: {result.expectedParticipants}</div>
              <div className={`font-bold ${result.discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                Discrepancy: {result.discrepancy > 0 ? '+' : ''}{result.discrepancy}
              </div>
            </div>
          </div>
          
          {result.orphanedParticipants.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800">
                Orphaned Participants ({result.orphanedParticipants.length})
              </h3>
              <div className="text-sm space-y-1">
                {result.orphanedParticipants.map(p => (
                  <div key={p.id} className="text-yellow-700">
                    {p.name} (ID: {p.id}, Invalid groupId: {p.groupId})
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {result.duplicates.length > 0 && (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <h3 className="text-lg font-semibold mb-2 text-red-800">
                Duplicate Participants ({result.duplicates.length})
              </h3>
              <div className="text-sm space-y-1">
                {result.duplicates.map((dup, index) => (
                  <div key={index} className="text-red-700">
                    "{dup.name}" in group {dup.groupId}: IDs {dup.ids.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Participants per Group</h3>
            <div className="text-sm space-y-1 max-h-60 overflow-y-auto">
              {result.groups.map(group => {
                const count = result.groupParticipantCounts[group.id];
                const isOverLimit = count > 7;
                return (
                  <div 
                    key={group.id} 
                    className={`${isOverLimit ? 'text-red-700 font-bold' : 'text-blue-700'}`}
                  >
                    {group.name}: {count} participants {isOverLimit ? '(OVER LIMIT!)' : ''}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Detailed Group Analysis</h3>
            <div className="text-sm space-y-2 max-h-80 overflow-y-auto">
              {result.groups.map(group => {
                const participantsInGroup = result.participants.filter(p => p.groupId === group.id);
                return (
                  <div key={group.id} className="border-l-2 border-gray-300 pl-3">
                    <div className="font-medium">{group.name} ({participantsInGroup.length} participants)</div>
                    {participantsInGroup.map(p => (
                      <div key={p.id} className="ml-4 text-gray-600">
                        • {p.name} (ID: {p.id})
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h3 className="text-lg font-semibold mb-2 text-green-800">Console Output</h3>
            <p className="text-sm text-green-700">
              Detailed investigation data has been logged to the browser console. 
              Open Developer Tools (F12) and check the Console tab for complete data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInvestigation;