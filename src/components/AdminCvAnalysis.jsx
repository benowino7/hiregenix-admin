import React, { useState, useEffect } from 'react';
import {
    FileSearch, Upload, Loader, Search, Check, X, ChevronDown, ChevronUp,
    Target, TrendingUp, AlertTriangle, Award, Briefcase, Star, Users,
    MessageSquare, Shield, Zap, GraduationCap, ArrowRight, Hash, FileText
} from 'lucide-react';
import { BASE_URL } from '../BaseUrl';
import successMessage from '../utilities/successMessage';
import ErrorMessage from '../utilities/ErrorMessage';

const ScoreRing = ({ score, size = 64 }) => {
    const color = score >= 85 ? 'text-green-500' : score >= 70 ? 'text-blue-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${score}, 100`} className={color} strokeLinecap="round" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center font-bold ${color}`}
                style={{ fontSize: size * 0.22 }}>{score}%</span>
        </div>
    );
};

const TierBadge = ({ tier }) => {
    const styles = {
        excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        strong: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        weak: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[tier] || styles.moderate}`}>
            {tier?.charAt(0).toUpperCase() + tier?.slice(1) || 'N/A'}
        </span>
    );
};

const AdminCvAnalysis = () => {
    const token = JSON.parse(sessionStorage?.getItem('accessToken'));
    const [jobs, setJobs] = useState([]);
    const [selectedJobIds, setSelectedJobIds] = useState([]);
    const [jobSearch, setJobSearch] = useState('');
    const [showJobDropdown, setShowJobDropdown] = useState(false);
    const [cvFiles, setCvFiles] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'rankings'

    useEffect(() => { fetchJobs(); }, []);

    const fetchJobs = async (search = '') => {
        setLoadingJobs(true);
        try {
            const params = new URLSearchParams({ limit: 100 });
            if (search) params.append('search', search);
            const res = await fetch(`${BASE_URL}/admin/cv-analysis/jobs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.status === 'SUCCESS') setJobs(data.data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
        } finally {
            setLoadingJobs(false);
        }
    };

    const toggleJob = (id) => {
        setSelectedJobIds(prev =>
            prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
        );
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) setCvFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setCvFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (cvFiles.length === 0) return ErrorMessage('Please upload at least one CV PDF');
        if (selectedJobIds.length === 0) return ErrorMessage('Please select at least one job');

        setAnalyzing(true);
        setResults(null);
        try {
            const fd = new FormData();
            cvFiles.forEach(f => fd.append('file', f));
            fd.append('jobIds', JSON.stringify(selectedJobIds));

            const res = await fetch(`${BASE_URL}/admin/cv-analysis`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setResults(data.data);
            successMessage('CV analysis completed');
        } catch (err) {
            ErrorMessage(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const filteredJobs = jobs.filter(j =>
        j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.company?.name?.toLowerCase().includes(jobSearch.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FileSearch className="text-teal-500" size={28} />
                    CV Skill Gap Analysis
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Upload CVs and select jobs to analyze skill gaps, score candidates, and rank matches using AI
                </p>
            </div>

            {/* Upload & Selection Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* CV Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Upload Candidate CV(s) — PDF
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                            cvFiles.length > 0 ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                            {cvFiles.length > 0 ? (
                                <div className="space-y-2">
                                    {cvFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText size={16} className="text-green-500 flex-shrink-0" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</span>
                                                <span className="text-xs text-gray-500 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                                            </div>
                                            <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-teal-400 text-teal-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors mt-2">
                                        + Add More CVs
                                        <input type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500 mb-3">Upload one or multiple candidate CVs for comparison</p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">
                                        Choose PDF(s)
                                        <input type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Job Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Jobs to Analyze Against ({selectedJobIds.length} selected)
                        </label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={jobSearch}
                                onChange={(e) => setJobSearch(e.target.value)}
                                onFocus={() => setShowJobDropdown(true)}
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        {showJobDropdown && (
                            <div className="mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 relative">
                                <div className="sticky top-0 bg-white dark:bg-gray-800 p-1 border-b dark:border-gray-700 flex justify-between items-center px-3">
                                    <span className="text-xs text-gray-500">{filteredJobs.length} jobs</span>
                                    <button onClick={() => setShowJobDropdown(false)}
                                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Close</button>
                                </div>
                                {filteredJobs.map(job => (
                                    <button key={job.id} type="button"
                                        onClick={() => toggleJob(job.id)}
                                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${
                                            selectedJobIds.includes(job.id) ? 'bg-teal-50 dark:bg-teal-900/10' : ''
                                        }`}>
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">{job.title}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{job.company?.name}</span>
                                        </div>
                                        {selectedJobIds.includes(job.id) && <Check size={14} className="text-teal-500 flex-shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedJobIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedJobIds.map(id => {
                                    const job = jobs.find(j => j.id === id);
                                    return job ? (
                                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded text-xs">
                                            {job.title}
                                            <button onClick={() => toggleJob(id)}><X size={12} /></button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleAnalyze}
                    disabled={analyzing || cvFiles.length === 0 || selectedJobIds.length === 0}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {analyzing ? (
                        <>
                            <Loader size={18} className="animate-spin" />
                            Analyzing with Claude AI...
                        </>
                    ) : (
                        <>
                            <Target size={18} />
                            Run Skill Gap Analysis ({cvFiles.length} CV{cvFiles.length > 1 ? 's' : ''} vs {selectedJobIds.length} Job{selectedJobIds.length > 1 ? 's' : ''})
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {results && (
                <div className="space-y-6">
                    {/* Summary Bar */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">{results.totalCandidates}</span> Candidate{results.totalCandidates !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-gray-900 dark:text-white text-lg">{results.totalJobsAnalyzed}</span> Job{results.totalJobsAnalyzed !== 1 ? 's' : ''} Analyzed
                            </div>
                        </div>

                        {/* Tabs */}
                        {results.rankings?.length > 1 && (
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                                <button
                                    onClick={() => setActiveTab('analysis')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                                >Detailed Analysis</button>
                                <button
                                    onClick={() => setActiveTab('rankings')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'rankings' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                                >Rankings</button>
                            </div>
                        )}
                    </div>

                    {/* Rankings Tab */}
                    {activeTab === 'rankings' && results.rankings?.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users size={20} className="text-teal-500" />
                                    Candidate Rankings
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {results.rankings.map((r, i) => (
                                    <div key={i} className="p-5 flex items-center gap-5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                            i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-500'
                                        }`}>#{r.rank}</div>
                                        <ScoreRing score={r.averageScore} size={52} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{r.candidateName}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                Best match: <span className="font-medium">{r.topJobMatch}</span>
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs hidden lg:block">{r.summary}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Analysis Tab */}
                    {activeTab === 'analysis' && results.candidates?.map((candidate, ci) => (
                        <div key={ci} className="space-y-4">
                            {results.totalCandidates > 1 && (
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                        <Users size={18} className="text-teal-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{candidate.candidateName}</h2>
                                        <p className="text-xs text-gray-500">{candidate.fileName}</p>
                                    </div>
                                </div>
                            )}

                            {candidate.analyses?.map((analysis, ai) => {
                                const key = `${ci}-${ai}`;
                                const isExpanded = expandedCard === key;

                                return (
                                    <div key={key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                                        {/* Header Row */}
                                        <div className="p-5 cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : key)}>
                                            <div className="flex items-center gap-5">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500">
                                                    #{ai + 1}
                                                </div>
                                                <ScoreRing score={analysis.overallScore || 0} />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{analysis.jobTitle}</h3>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <Briefcase size={14} /> {analysis.company}
                                                        </span>
                                                        <TierBadge tier={analysis.tier} />
                                                        <span className="text-xs text-gray-400">
                                                            {analysis.matchLevel}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>

                                            {/* Quick Skills Preview */}
                                            <div className="flex flex-wrap gap-1.5 mt-3 ml-[6.5rem]">
                                                {analysis.matchedSkills?.slice(0, 5).map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs flex items-center gap-1">
                                                        <Check size={10} /> {skill}
                                                    </span>
                                                ))}
                                                {analysis.missingSkills?.slice(0, 3).map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs flex items-center gap-1">
                                                        <X size={10} /> {skill}
                                                    </span>
                                                ))}
                                                {analysis.transferableSkills?.slice(0, 2).map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs flex items-center gap-1">
                                                        <ArrowRight size={10} /> {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 dark:border-gray-700 p-5 space-y-6 bg-gray-50 dark:bg-gray-800/50">
                                                {/* Score Breakdown */}
                                                {analysis.scoreBreakdown && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                                            <Hash size={16} className="text-teal-500" />
                                                            Score Breakdown
                                                        </h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {[
                                                                { label: 'Skills', value: analysis.scoreBreakdown.skillMatch, icon: Zap },
                                                                { label: 'Experience', value: analysis.scoreBreakdown.experienceMatch, icon: Briefcase },
                                                                { label: 'Education', value: analysis.scoreBreakdown.educationMatch, icon: GraduationCap },
                                                                { label: 'Overall Fit', value: analysis.scoreBreakdown.overallFit, icon: Target },
                                                            ].map((item, i) => (
                                                                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                                                                    <item.icon size={16} className="mx-auto mb-1 text-gray-400" />
                                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">{item.value || 0}%</div>
                                                                    <div className="text-xs text-gray-500">{item.label}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skill Gap Analysis */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                        <Target size={16} className="text-teal-500" />
                                                        Skill Gap Analysis
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{analysis.skillGapAnalysis}</p>
                                                </div>

                                                {/* Experience & Education Match */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                            <TrendingUp size={16} className="text-blue-500" />
                                                            Experience Match
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.experienceMatch}</p>
                                                    </div>
                                                    {analysis.educationMatch && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                                <GraduationCap size={16} className="text-indigo-500" />
                                                                Education Match
                                                            </h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.educationMatch}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Strengths & Weaknesses */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                                                            <Award size={16} /> Strengths
                                                        </h4>
                                                        <ul className="space-y-1">
                                                            {analysis.strengths?.map((s, i) => (
                                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                                    <Check size={14} className="text-green-500 flex-shrink-0 mt-0.5" /> {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                                                            <AlertTriangle size={16} /> Areas for Improvement
                                                        </h4>
                                                        <ul className="space-y-1">
                                                            {analysis.weaknesses?.map((w, i) => (
                                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" /> {w}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {/* Green & Red Flags */}
                                                {(analysis.greenFlags?.length > 0 || analysis.redFlags?.length > 0) && (
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {analysis.greenFlags?.length > 0 && (
                                                            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                                                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                                                                    <Shield size={14} /> Green Flags
                                                                </h4>
                                                                <ul className="space-y-1">
                                                                    {analysis.greenFlags.map((f, i) => (
                                                                        <li key={i} className="text-xs text-green-700 dark:text-green-400">+ {f}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {analysis.redFlags?.length > 0 && (
                                                            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                                                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                                                                    <AlertTriangle size={14} /> Red Flags
                                                                </h4>
                                                                <ul className="space-y-1">
                                                                    {analysis.redFlags.map((f, i) => (
                                                                        <li key={i} className="text-xs text-red-700 dark:text-red-400">- {f}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Matched vs Missing vs Transferable Skills */}
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Matched Skills ({analysis.matchedSkills?.length || 0})
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {analysis.matchedSkills?.map((skill, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium">{skill}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Missing Skills ({analysis.missingSkills?.length || 0})
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {analysis.missingSkills?.map((skill, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">{skill}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {analysis.transferableSkills?.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                                Transferable Skills ({analysis.transferableSkills.length})
                                                            </h4>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {analysis.transferableSkills.map((skill, i) => (
                                                                    <span key={i} className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium">{skill}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Interview Talking Points */}
                                                {analysis.interviewTalkingPoints?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                            <MessageSquare size={16} className="text-purple-500" />
                                                            Interview Talking Points
                                                        </h4>
                                                        <ol className="space-y-1.5 list-decimal list-inside">
                                                            {analysis.interviewTalkingPoints.map((point, i) => (
                                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{point}</li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}

                                                {/* Recruiter Summary */}
                                                {analysis.recruiterSummary && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1">
                                                            <Star size={16} /> Recruiter Summary
                                                        </h4>
                                                        <p className="text-sm text-blue-700 dark:text-blue-400">{analysis.recruiterSummary}</p>
                                                    </div>
                                                )}

                                                {/* Recommendation */}
                                                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-2 mb-1">
                                                        <Award size={16} /> Recommendation
                                                    </h4>
                                                    <p className="text-sm text-teal-700 dark:text-teal-400">{analysis.recommendation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCvAnalysis;
