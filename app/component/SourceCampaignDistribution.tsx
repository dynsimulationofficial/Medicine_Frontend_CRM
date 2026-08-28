"use client";

import React from "react";

export interface CampaignRankingItem {
  rank?: number;
  campaign_id?: string;
  campaign_name: string;
  source_name: string;
  leads_count: number;
  converted_count: number;
  percentage: number; // % of all CRM leads
  conversion_rate: number;
}

interface SourceCampaignDistributionProps {
  campaignsRanking?: CampaignRankingItem[];
  totalLeads: number;
  title?: string;
}

export default function SourceCampaignDistribution({
  campaignsRanking = [],
  totalLeads = 0,
  title = "Leads by Campaign",
}: SourceCampaignDistributionProps) {
  const campaignsList = campaignsRanking;

  return (
    <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl p-5 shadow-sm text-white">
      {/* Clean Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Campaign-wise lead count aur percentage contribution
          </p>
        </div>

        <div className="px-3 py-1 rounded bg-[#272727] border border-gray-700 text-xs">
          <span className="text-gray-400">Total Leads: </span>
          <strong className="text-white font-bold">{totalLeads}</strong>
        </div>
      </div>

      {/* Clean, Simple Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#181818] text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-800">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Lead Source</th>
              <th className="py-2.5 px-4">Campaign Name</th>
              <th className="py-2.5 px-4 text-center">Leads</th>
              <th className="py-2.5 px-4 w-1/3">Share (%)</th>
              <th className="py-2.5 px-4 text-center">Converted</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800/60">
            {campaignsList.length > 0 ? (
              campaignsList.map((item, idx) => (
                <tr
                  key={item.campaign_id || idx}
                  className="hover:bg-[#252525] transition"
                >
                  {/* Rank Number */}
                  <td className="py-3 px-4 text-center text-gray-400 font-medium">
                    {idx + 1}
                  </td>

                  {/* Lead Source */}
                  <td className="py-3 px-4 text-gray-300 font-medium">
                    {item.source_name || "Direct"}
                  </td>

                  {/* Campaign Name */}
                  <td className="py-3 px-4 font-semibold text-white">
                    {item.campaign_name}
                  </td>

                  {/* Leads Count */}
                  <td className="py-3 px-4 text-center font-bold text-white">
                    {item.leads_count}
                  </td>

                  {/* Percentage Share Progress Bar */}
                  <td className="py-3 px-4">
                    <div className="w-full">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-white">
                          {item.percentage}%
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {item.leads_count} / {totalLeads}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          className="h-full bg-primary-500 rounded-full"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Converted Leads */}
                  <td className="py-3 px-4 text-center text-gray-300 font-medium">
                    {item.converted_count}
                    {Number(item.leads_count) > 0 && (
                      <span className="text-gray-500 text-[11px] ml-1">
                        ({item.conversion_rate}%)
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500 text-xs">
                  No campaign lead records found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

