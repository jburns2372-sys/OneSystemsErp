'use client';

import React, { useEffect, useState } from 'react';
import { getApplicableRulesForModule, getRecentAuditLogsForModule } from '@/app/actions/knowledgeEnforcement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, BookOpen, CheckCircle, Lock, ShieldAlert } from 'lucide-react';

interface ApplicableRulesPanelProps {
  moduleName: string;
}

export default function ApplicableRulesPanel({ moduleName }: ApplicableRulesPanelProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [rulesRes, logsRes] = await Promise.all([
        getApplicableRulesForModule(moduleName),
        getRecentAuditLogsForModule(moduleName)
      ]);
      
      if (rulesRes.success) setRules(rulesRes.data || []);
      if (logsRes.success) setAuditLogs(logsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [moduleName]);

  if (loading) return null; // Or a skeleton

  if (rules.length === 0 && auditLogs.length === 0) return null;

  return (
    <div className="w-full space-y-4 mb-8">
      <Card className="border-l-4 border-l-blue-600 shadow-md">
        <CardHeader 
          className="bg-slate-50 py-3 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-slate-700">
              AI Validation Reference & Mandatory Rules
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs bg-white text-blue-700">Module: {moduleName}</Badge>
            <span className="text-slate-400 font-bold">{isExpanded ? '−' : '+'}</span>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-t">
              {/* Left Column: Applicable Rules */}
              <div className="p-4 bg-white">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" /> Active Knowledge Notebook Rules
                </h4>
                <ScrollArea className="h-48 pr-4">
                  <div className="space-y-3">
                    {rules.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No specific mandatory rules seeded for this module yet.</p>
                    ) : rules.map((rule) => (
                      <div key={rule.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-blue-900 text-sm">{rule.ruleTitle}</span>
                          <Badge variant="destructive" className="text-[10px] uppercase h-5">{rule.severity}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{rule.ruleDescription}</p>
                        <div className="flex items-center text-[10px] text-slate-500 justify-between">
                          <span>Notebook: {rule.notebookName}</span>
                          {rule.sourceLink && (
                            <a href={rule.sourceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Reference
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Right Column: Recent Audits */}
              <div className="p-4 bg-slate-50">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center">
                  <Lock className="h-3 w-3 mr-1" /> Recent Validation Logs
                </h4>
                <ScrollArea className="h-48 pr-4">
                  <div className="space-y-3">
                    {auditLogs.length === 0 ? (
                       <p className="text-sm text-slate-400 italic">No recent rule enforcements or overrides logged.</p>
                    ) : auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-white border shadow-sm rounded-md text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-700 truncate max-w-[200px]">{log.ruleApplied}</span>
                          {log.validationResult === 'BLOCKED' ? (
                            <Badge variant="destructive" className="h-5"><AlertCircle className="h-3 w-3 mr-1"/> Blocked</Badge>
                          ) : log.validationResult === 'APPROVED' ? (
                            <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 h-5"><CheckCircle className="h-3 w-3 mr-1"/> Approved</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 h-5">Warning</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Action:</span> {log.actionTaken}</p>
                        {log.overrideRequested && (
                          <p className="text-[10px] text-red-600 mt-1 font-medium bg-red-50 p-1 rounded">
                            Override by {log.overrideApprovedBy}: {log.overrideReason}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2 text-right">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
