'use client';

import { PatternGroup } from '@/lib/mockData';

interface PatternGroupsProps {
  groups: PatternGroup[];
}

export default function PatternGroups({ groups }: PatternGroupsProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border border-charcoal-100">
        <p className="text-charcoal-400">No pattern groups found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div 
          key={group.id} 
          className={`bg-white rounded-xl border p-4 ${
            group.potential_class_action ? 'border-coral-200 shadow-sm' : 'border-charcoal-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-charcoal-600 font-medium line-clamp-2">
                {group.message_template}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm text-charcoal-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <span className="font-medium text-charcoal">{group.report_count}</span> reports
                </div>
                <div className="flex items-center gap-1 text-sm text-charcoal-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="font-medium text-charcoal">{group.sender_numbers.length}</span> numbers
                </div>
              </div>
            </div>
            <div className="ml-4">
              {group.potential_class_action ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-coral-50 text-coral-600 border border-coral-200">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Class Action
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-charcoal-50 text-charcoal-400 border border-charcoal-200">
                  Pattern
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
