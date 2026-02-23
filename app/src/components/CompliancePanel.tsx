'use client';

import { useState, useEffect } from 'react';
import { checkCompliance, ComplianceResult, ComplianceIssue, getComplianceBadge } from '@/lib/compliance-rules';

interface CompliancePanelProps {
  outline: any;
  onIssueClick?: (slideIndex: number) => void;
  onExport?: () => void;
}

export default function CompliancePanel({ outline, onIssueClick, onExport }: CompliancePanelProps) {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  useEffect(() => {
    if (outline) {
      const complianceResult = checkCompliance(outline);
      setResult(complianceResult);
    }
  }, [outline]);

  if (!result) return null;

  const badge = getComplianceBadge(result);
  const filteredIssues = result.issues.filter(issue => 
    filter === 'all' || issue.type === filter
  );

  const getTypeStyles = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: '⚠️',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: '⚡',
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: 'ℹ️',
        };
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#212121] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
            badge.color === 'green' ? 'bg-green-500/20' :
            badge.color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'
          }`}>
            {badge.icon}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">Compliance Check</h3>
            <p className={`text-xs ${badge.color === 'green' ? 'text-green-400' : badge.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
              {badge.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.summary.errors > 0 && onExport && (
            <span className="text-xs text-gray-500">Export blocked</span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-700">
          {/* Filter Tabs */}
          <div className="px-4 py-2 flex items-center gap-2 bg-[#141414]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({result.issues.length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'error' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              Errors ({result.summary.errors})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              Warnings ({result.summary.warnings})
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'info' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-blue-400'
              }`}
            >
              Info ({result.summary.info})
            </button>
          </div>

          {/* Issues List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredIssues.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No issues to display
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredIssues.map((issue, index) => {
                  const styles = getTypeStyles(issue.type);
                  return (
                    <div
                      key={issue.id || index}
                      className={`px-4 py-3 hover:bg-[#212121] transition-colors ${
                        issue.slideIndex !== undefined && onIssueClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (issue.slideIndex !== undefined && onIssueClick) {
                          onIssueClick(issue.slideIndex);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5">{styles.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${styles.text}`}>
                            {issue.message}
                          </p>
                          {issue.slideIndex !== undefined && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Slide {issue.slideIndex + 1}
                              {issue.slideLayout && ` • ${issue.slideLayout.replace(/_/g, ' ')}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {issue.description}
                          </p>
                          {issue.fix && (
                            <p className="text-xs text-[#FEC00F] mt-1.5 flex items-center gap-1">
                              <span>💡</span> {issue.fix}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {result.summary.errors > 0 && (
            <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/20">
              <p className="text-xs text-red-400">
                <strong>Export blocked:</strong> Please fix all errors before exporting.
                {result.summary.warnings > 0 && ` (${result.summary.warnings} warnings can be ignored)`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact compliance badge for headers
 */
export function ComplianceBadge({ outline }: { outline: any }) {
  const [result, setResult] = useState<ComplianceResult | null>(null);

  useEffect(() => {
    if (outline) {
      setResult(checkCompliance(outline));
    }
  }, [outline]);

  if (!result) return null;

  const badge = getComplianceBadge(result);

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
      badge.color === 'green' ? 'bg-green-500/20 text-green-400' :
      badge.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
      'bg-red-500/20 text-red-400'
    }`}>
      <span>{badge.icon}</span>
      <span>{badge.label}</span>
    </div>
  );
}