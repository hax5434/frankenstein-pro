import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Trash2, Linkedin, User, ChevronDown, ChevronUp, Sparkles, X, LoaderCircle, Sun, Moon, Coffee } from 'lucide-react';

// --- Helper Data ---
const COMMON_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
  'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);


// --- UTILS: src/utils/keywordUtils.js ---
const processKeywords = (text, options) => {
  let words = text.split(/\s+/).filter(Boolean);

  // STEP 1: Initial Cleaning & Normalization
  if (options.toLowerCase) {
    words = words.map(word => word.toLowerCase());
  }
  if (options.toUpperCase) {
    words = words.map(word => word.toUpperCase());
  }
  if (options.removeSpecialChars) {
    words = words.map(word => word.replace(/[^a-zA-Z0-9\s]/g, ''));
  }
  if (options.removeNumbers) {
    words = words.filter(word => !/\d/.test(word));
  }

  // STEP 2: Word Removal
  if (options.removeDuplicates) {
    words = [...new Set(words)];
  }
  if (options.removeCommon) {
    words = words.filter(word => !COMMON_WORDS.has(word.toLowerCase()));
  }
  if (options.removeUncommon) {
    const freq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    words = words.filter(word => freq[word] > 1);
  }
  if (options.removeSingleLetters) {
    words = words.filter(word => word.length > 1);
  }
  if (options.removeMultiLetters) {
    words = words.filter(word => word.length <= 1);
  }
  if (options.removeSpecificWords) {
    const specificWords = new Set(options.specificWordsToRemove.toLowerCase().split(',').map(w => w.trim()).filter(Boolean));
    words = words.filter(word => !specificWords.has(word.toLowerCase()));
  }

  // STEP 3: Sorting
  if (options.sortAlphabetically === 'az') {
    words.sort((a, b) => a.localeCompare(b));
  } else if (options.sortAlphabetically === 'za') {
    words.sort((a, b) => b.localeCompare(a));
  }
  if (options.sortByLength === 'asc') {
    words.sort((a, b) => a.length - b.length);
  } else if (options.sortByLength === 'desc') {
    words.sort((a, b) => b.length - a.length);
  }
  if (options.sortByFrequency) {
    const freq = text.split(/\s+/).filter(Boolean).reduce((acc, word) => {
        const key = options.toLowerCase ? word.toLowerCase() : options.toUpperCase ? word.toUpperCase() : word;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    words.sort((a, b) => (freq[b] || 0) - (freq[a] || 0) || a.localeCompare(b));
  }

  // STEP 4: Final Formatting
  if (options.addPrefix) {
    words = words.map(word => `${options.prefixValue}${word}`);
  }
  if (options.addSuffix) {
    words = words.map(word => `${word}${options.suffixValue}`);
  }
  
  let separator = '';
  if(options.separators.space) separator += ' ';
  if(options.separators.comma) separator += ',';
  if(options.separators.pipe) separator += '|';
  if(options.separators.custom) separator += options.customSeparator;
  if(separator === '') separator = ' ';


  return words.join(separator);
};

const calculateFrequency = (text) => {
  if (!text.trim()) return [];
  const words = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const freqMap = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(freqMap)
    .map(([keyword, frequency]) => ({ keyword, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
};


// --- COMPONENTS: src/components ---

const Tooltip = ({ text, children }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      {text}
    </div>
  </div>
);

const CustomCheckbox = ({ id, label, checked, onChange, disabled = false }) => (
  <label htmlFor={id} className={`flex items-center space-x-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className="relative">
      <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} disabled={disabled} />
      <div className={`w-10 h-5 ${checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'} rounded-full shadow-inner transition-colors duration-300`}></div>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </label>
);

const Section = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 px-1 text-left font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const KeywordOptions = ({ options, setOptions, aiActions, isAiLoading }) => {
  const handleOptionChange = (option) => (e) => {
    setOptions(prev => ({ ...prev, [option]: e.target.checked }));
  };
  
  const handleRadioChange = (option, value) => {
     setOptions(prev => {
        const isDeselecting = prev[option] === value;
        return { ...prev, [option]: isDeselecting ? null : value };
    });
  };

  const handleInputChange = (option) => (e) => {
    setOptions(prev => ({ ...prev, [option]: e.target.value }));
  };

  const handleSeparatorChange = (separator) => (e) => {
    setOptions(prev => ({
        ...prev,
        separators: {
            ...prev.separators,
            [separator]: e.target.checked
        }
    }))
  }

  const AiButton = ({ onClick, children }) => (
    <button
      onClick={onClick}
      disabled={isAiLoading}
      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900"
    >
      {isAiLoading ? (
        <LoaderCircle size={20} className="animate-spin mr-2" />
      ) : (
        <Sparkles size={16} className="mr-2" />
      )}
      {children}
    </button>
  );

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Processing Options</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select transformations to apply.</p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <Section title="✨ AI-Powered Tools" defaultOpen={true}>
            <AiButton onClick={aiActions.handleExpandKeywords}>Expand Keyword List</AiButton>
            <AiButton onClick={aiActions.handleGroupKeywords}>Group by Intent</AiButton>
            <AiButton onClick={aiActions.handleCreateAdCopy}>Create Ad Copy</AiButton>
            <AiButton onClick={aiActions.handleSummarize}>Summarize to 200 Chars</AiButton>
        </Section>
        
        <Section title="Remove Words">
          <CustomCheckbox id="removeDuplicates" label="Remove Duplicate Words" checked={options.removeDuplicates} onChange={handleOptionChange('removeDuplicates')} />
          <CustomCheckbox id="removeSingleLetters" label="Remove Single-Letter Words" checked={options.removeSingleLetters} onChange={handleOptionChange('removeSingleLetters')} />
          <CustomCheckbox id="removeMultiLetters" label="Keep Only Single-Letter Words" checked={options.removeMultiLetters} onChange={handleOptionChange('removeMultiLetters')} />
          <CustomCheckbox id="removeNumbers" label="Remove Words with Numbers" checked={options.removeNumbers} onChange={handleOptionChange('removeNumbers')} />
          <CustomCheckbox id="removeCommon" label="Remove Common Words" checked={options.removeCommon} onChange={handleOptionChange('removeCommon')} />
          <CustomCheckbox id="removeUncommon" label="Remove Uncommon Words" checked={options.removeUncommon} onChange={handleOptionChange('removeUncommon')} />
          <CustomCheckbox id="removeSpecialChars" label="Remove All Special Characters" checked={options.removeSpecialChars} onChange={handleOptionChange('removeSpecialChars')} />
          <div className="space-y-2">
             <CustomCheckbox id="removeSpecificWords" label="Remove Specific Word(s)" checked={options.removeSpecificWords} onChange={handleOptionChange('removeSpecificWords')} />
             <input
                type="text"
                placeholder="e.g., free,new,sale"
                value={options.specificWordsToRemove}
                onChange={handleInputChange('specificWordsToRemove')}
                disabled={!options.removeSpecificWords}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700"
             />
          </div>
        </Section>

        <Section title="Formatting">
           <CustomCheckbox id="toLowerCase" label="Convert to Lowercase" checked={options.toLowerCase} onChange={(e) => setOptions(prev => ({...prev, toLowerCase: e.target.checked, toUpperCase: false}))} />
           <CustomCheckbox id="toUpperCase" label="Convert to Uppercase" checked={options.toUpperCase} onChange={(e) => setOptions(prev => ({...prev, toUpperCase: e.target.checked, toLowerCase: false}))} />
           <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Add Separator Between Words</label>
              <div className="grid grid-cols-2 gap-2">
                  <CustomCheckbox id="sepSpace" label="Space" checked={options.separators.space} onChange={handleSeparatorChange('space')} />
                  <CustomCheckbox id="sepComma" label="Comma" checked={options.separators.comma} onChange={handleSeparatorChange('comma')} />
                  <CustomCheckbox id="sepPipe" label="Pipe" checked={options.separators.pipe} onChange={handleSeparatorChange('pipe')} />
              </div>
              <div className="space-y-2">
                <CustomCheckbox id="sepCustom" label="Custom" checked={options.separators.custom} onChange={handleSeparatorChange('custom')} />
                <input
                    type="text"
                    placeholder="Custom separator..."
                    value={options.customSeparator}
                    onChange={handleInputChange('customSeparator')}
                    disabled={!options.separators.custom}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700"
                />
              </div>
           </div>
           <div className="space-y-2">
             <CustomCheckbox id="addPrefix" label="Add Prefix" checked={options.addPrefix} onChange={handleOptionChange('addPrefix')} />
             <input type="text" placeholder="Prefix" value={options.prefixValue} onChange={handleInputChange('prefixValue')} disabled={!options.addPrefix} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700" />
           </div>
           <div className="space-y-2">
             <CustomCheckbox id="addSuffix" label="Add Suffix" checked={options.addSuffix} onChange={handleOptionChange('addSuffix')} />
             <input type="text" placeholder="Suffix" value={options.suffixValue} onChange={handleInputChange('suffixValue')} disabled={!options.addSuffix} className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:disabled:bg-gray-700" />
           </div>
        </Section>

        <Section title="Sorting">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Sort Alphabetically</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name="sortAlpha" value="az" checked={options.sortAlphabetically === 'az'} onChange={() => handleRadioChange('sortAlphabetically', 'az')} className="form-radio text-orange-500 focus:ring-orange-500 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm dark:text-gray-300">A-Z</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="sortAlpha" value="za" checked={options.sortAlphabetically === 'za'} onChange={() => handleRadioChange('sortAlphabetically', 'za')} className="form-radio text-orange-500 focus:ring-orange-500 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm dark:text-gray-300">Z-A</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Sort by Word Length</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name="sortLength" value="asc" checked={options.sortByLength === 'asc'} onChange={() => handleRadioChange('sortByLength', 'asc')} className="form-radio text-orange-500 focus:ring-orange-500 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm dark:text-gray-300">Ascending</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="sortLength" value="desc" checked={options.sortByLength === 'desc'} onChange={() => handleRadioChange('sortByLength', 'desc')} className="form-radio text-orange-500 focus:ring-orange-500 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm dark:text-gray-300">Descending</span>
              </label>
            </div>
          </div>
          <CustomCheckbox id="sortByFrequency" label="Sort by Frequency (Descending)" checked={options.sortByFrequency} onChange={handleOptionChange('sortByFrequency')} />
        </Section>
      </div>
    </div>
  );
};

const KeywordIO = ({ rawKeywords, setRawKeywords, processedKeywords, onProcess, wordCount, charCount }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(processedKeywords);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([processedKeywords], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'frankenstein_pro_keywords.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            {/* Input Section */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Input Keywords</h3>
                    <Tooltip text="Clear Input">
                        <button onClick={() => setRawKeywords('')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </Tooltip>
                </div>
                <textarea
                    value={rawKeywords}
                    onChange={(e) => setRawKeywords(e.target.value)}
                    placeholder="Paste your keywords here, one per line or separated by spaces/commas..."
                    className="w-full flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
            </div>

            {/* Action Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onProcess}
                className="w-full py-3 px-6 bg-orange-500 text-white font-bold rounded-lg shadow-md hover:bg-orange-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-700"
            >
                PROCESS KEYWORDS
            </motion.button>

            {/* Output Section */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Processed Output</h3>
                    <div className="flex items-center space-x-2">
                        <Tooltip text="Download as .txt">
                            <button onClick={handleDownload} className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <Download size={18} />
                            </button>
                        </Tooltip>
                        <Tooltip text={copied ? "Copied!" : "Copy to Clipboard"}>
                            <button onClick={handleCopy} className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                {copied ? <motion.div initial={{scale:0}} animate={{scale:1}}><Check size={18} className="text-green-500" /></motion.div> : <Copy size={18} />}
                            </button>
                        </Tooltip>
                    </div>
                </div>
                <textarea
                    value={processedKeywords}
                    readOnly
                    placeholder="Your processed keywords will appear here..."
                    className="w-full flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-gray-800 dark:text-gray-200"
                />
                <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono">
                    <span>Chars: {charCount}</span> | <span>Words: {wordCount}</span>
                </div>
            </div>
        </div>
    );
};

const FrequencyTable = ({ data }) => {
    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,Keyword,Frequency\n";
        data.forEach(row => {
            csvContent += `${row.keyword},${row.frequency}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "keyword_frequency.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Keyword Frequency</h3>
                <Tooltip text="Export as .csv">
                    <button onClick={handleExport} disabled={!data.length} className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download size={18} />
                    </button>
                </Tooltip>
            </div>
            <div className="flex-grow overflow-y-auto border dark:border-gray-700 rounded-md">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Keyword</th>
                            <th scope="col" className="px-6 py-3 text-right">Frequency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.length > 0 ? (
                            data.map(({ keyword, frequency }, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{keyword}</td>
                                    <td className="px-6 py-4 text-right">{frequency}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2" className="text-center py-10 text-gray-500 dark:text-gray-400">No data to display. Process some keywords first.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CreditCardFooter = () => (
    <a href="https://www.linkedin.com/in/singhviveksanjay/" target="_blank" rel="noopener noreferrer" 
       className="group w-full max-w-md mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-5 flex justify-between items-center transition-all duration-300 transform hover:scale-105 hover:shadow-orange-400/30">
        <div className="text-white">
            <p className="text-xs font-mono tracking-widest opacity-70">BUILT BY</p>
            <p className="text-lg font-semibold tracking-wider">@viveksanjaysingh</p>
        </div>
        <div className="flex items-center space-x-3">
            <Linkedin className="text-gray-400 group-hover:text-white transition-colors" size={24} />
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-700 group-hover:border-orange-400 transition-colors">
                <User size={20} />
            </div>
        </div>
    </a>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{title}</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </header>
                        <div className="p-6 overflow-y-auto text-gray-700 dark:text-gray-300">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ThemeSwitcher = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-14 h-8 rounded-full p-1 bg-gray-200 dark:bg-gray-700 relative transition-colors duration-500 ease-in-out flex items-center"
        >
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                style={{
                    marginLeft: theme === 'dark' ? 'auto' : '0',
                    marginRight: theme === 'dark' ? '0' : 'auto',
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {theme === 'dark' ? (
                        <motion.div key="moon" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <Moon size={16} className="text-gray-700" />
                        </motion.div>
                    ) : (
                        <motion.div key="sun" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <Sun size={16} className="text-orange-500" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </button>
    );
};


// --- MAIN APP COMPONENT: src/App.jsx ---
export default function App() {
    const [rawKeywords, setRawKeywords] = useState('');
    const [processedKeywords, setProcessedKeywords] = useState('');
    const [frequencyData, setFrequencyData] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const [options, setOptions] = useState({
        removeDuplicates: true,
        removeSingleLetters: false,
        removeMultiLetters: false,
        removeNumbers: false,
        removeSpecialChars: true,
        removeSpecificWords: false,
        specificWordsToRemove: '',
        toLowerCase: true,
        toUpperCase: false,
        removeCommon: false,
        removeUncommon: false,
        sortAlphabetically: null,
        sortByLength: null,
        sortByFrequency: false,
        separators: {
            space: true,
            comma: false,
            pipe: false,
            custom: false,
        },
        customSeparator: '',
        addPrefix: false,
        prefixValue: '',
        addSuffix: false,
        suffixValue: '',
    });

    const handleProcessKeywords = useCallback(() => {
        const result = processKeywords(rawKeywords, options);
        setProcessedKeywords(result);
        const freq = calculateFrequency(rawKeywords);
        setFrequencyData(freq);
    }, [rawKeywords, options]);
    
    // --- Gemini API Call Logic ---
    const callGemini = async (payload) => {
        setIsAiLoading(true);
        try {
            const apiKey = ""; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                console.error("API Error Body:", errorBody);
                throw new Error(`API call failed with status: ${response.status}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure:", result);
                throw new Error("Could not extract text from API response.");
            }
        } catch (error) {
            console.error("Gemini API call error:", error);
            setModalTitle("Error");
            setModalContent(<p className="text-red-500">An error occurred: {error.message}</p>);
            setIsModalOpen(true);
            return null;
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleExpandKeywords = async () => {
        if (!rawKeywords.trim()) return;
        const prompt = `You are an Amazon SEO expert. Given the following keywords, generate 50 more highly relevant and related keywords for an Amazon product listing. Return only the new keywords, separated by spaces. Keywords: ${rawKeywords}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const result = await callGemini(payload);
        if (result) {
            setRawKeywords(prev => `${prev}\n${result}`);
        }
    };

    const handleGroupKeywords = async () => {
        if (!processedKeywords.trim()) return;
        const prompt = `You are an Amazon SEO expert. Analyze this list of keywords and group them by customer intent or logical category. Keywords: ${processedKeywords}`;
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            groupName: { type: "STRING", description: "The name of the keyword group (e.g., 'Color Variations', 'Competitor Brands')." },
                            keywords: { type: "ARRAY", items: { type: "STRING" } }
                        },
                        required: ["groupName", "keywords"]
                    }
                }
            }
        };
        const result = await callGemini(payload);
        if (result) {
            try {
                const parsedResult = JSON.parse(result);
                const formattedContent = (
                    <div className="space-y-4">
                        {parsedResult.map((group, index) => (
                            <div key={index}>
                                <h3 className="font-bold text-md text-gray-800 dark:text-gray-200 mb-2">{group.groupName}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {group.keywords.map((kw, kwIndex) => (
                                        <span key={kwIndex} className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{kw}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
                setModalTitle("✨ Keyword Groups by Intent");
                setModalContent(formattedContent);
                setIsModalOpen(true);
            } catch (e) {
                 setModalTitle("Error");
                 setModalContent(<p className="text-red-500">Failed to parse the AI response. Please try again.</p>);
                 setIsModalOpen(true);
            }
        }
    };

    const handleCreateAdCopy = async () => {
        if (!processedKeywords.trim()) return;
        const prompt = `You are a professional copywriter specializing in Amazon PPC ads. Using the following keywords, write 5 compelling, short, and high-converting ad headlines. Each headline should be on a new line. Keywords: ${processedKeywords}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const result = await callGemini(payload);
        if (result) {
            const formattedContent = (
                <ul className="list-disc list-inside space-y-2">
                    {result.split('\n').filter(line => line.trim() !== '').map((line, index) => (
                        <li key={index}>{line}</li>
                    ))}
                </ul>
            );
            setModalTitle("✨ Generated Ad Copy");
            setModalContent(formattedContent);
            setIsModalOpen(true);
        }
    };
    
    const handleSummarize = async () => {
        if (!processedKeywords.trim()) return;
        const prompt = `You are an Amazon SEO expert. Analyze the following list of keywords and summarize it into the most powerful and high-ranking keywords possible. The final output must be a single line of text and strictly under 200 characters including spaces. Keywords: ${processedKeywords}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const result = await callGemini(payload);
        if (result) {
            setModalTitle("✨ AI-Powered Summary (< 200 Chars)");
            setModalContent(
                <div>
                    <p className="mb-4">{result}</p>
                    <button onClick={() => { navigator.clipboard.writeText(result); setIsModalOpen(false); }} className="w-full px-4 py-2 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 transition">
                        Copy Summary
                    </button>
                </div>
            );
            setIsModalOpen(true);
        }
    };

    const openCoffeeModal = () => {
        setModalTitle("Buy me a coffee");
        setModalContent(
            <div className="text-center">
                <p className="mb-4">If you find this tool useful, consider supporting its development!</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=hax5434@oksbi" alt="UPI QR Code" className="mx-auto rounded-lg shadow-md" />
                <p className="mt-4 font-mono text-sm">hax5434@oksbi</p>
                <a href="upi://pay?pa=hax5434@oksbi" className="mt-4 inline-block w-full px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition">
                    Pay with UPI App
                </a>
            </div>
        );
        setIsModalOpen(true);
    };
    
    const aiActions = { handleExpandKeywords, handleGroupKeywords, handleCreateAdCopy, handleSummarize };

    const { wordCount, charCount } = useMemo(() => {
        const words = processedKeywords.split(/\s+/).filter(Boolean);
        return {
            wordCount: words.length,
            charCount: processedKeywords.length,
        };
    }, [processedKeywords]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 font-sans text-gray-900 transition-colors duration-300">
            <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Frankenstein <span className="text-orange-500">Pro</span> v5
                    </h1>
                    <div className="flex items-center space-x-4">
                        <motion.button 
                            onClick={openCoffeeModal}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            <Coffee size={18} className="text-orange-500"/>
                            <span>Buy me a coffee</span>
                        </motion.button>
                        <ThemeSwitcher theme={theme} setTheme={setTheme} />
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Left Column: Options */}
                    <div className="lg:col-span-1 h-full lg:max-h-[calc(100vh-150px)]">
                        <KeywordOptions options={options} setOptions={setOptions} aiActions={aiActions} isAiLoading={isAiLoading} />
                    </div>

                    {/* Middle Column: Input/Output */}
                    <div className="lg:col-span-1 h-full lg:max-h-[calc(100vh-150px)]">
                        <KeywordIO
                            rawKeywords={rawKeywords}
                            setRawKeywords={setRawKeywords}
                            processedKeywords={processedKeywords}
                            onProcess={handleProcessKeywords}
                            wordCount={wordCount}
                            charCount={charCount}
                        />
                    </div>

                    {/* Right Column: Frequency */}
                    <div className="lg:col-span-1 h-full lg:max-h-[calc(100vh-150px)]">
                        <FrequencyTable data={frequencyData} />
                    </div>
                </div>
            </main>

            <footer className="py-8 px-4">
                <CreditCardFooter />
            </footer>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
                {modalContent}
            </Modal>
        </div>
    );
}
