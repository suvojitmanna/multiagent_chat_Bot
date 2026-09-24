import React, { useState, useMemo, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearActiveArtifact } from '../redux/messageSlice'
import { 
  Play, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  X, 
  Maximize2, 
  Minimize2, 
  FileCode, 
  Sparkles,
  ExternalLink 
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark.js'

const getLanguageFromFileName = (name = '') => {
  const ext = name.split('.').pop().toLowerCase()
  switch (ext) {
    case 'html': return 'html'
    case 'css': return 'css'
    case 'js':
    case 'jsx': return 'javascript'
    case 'ts':
    case 'tsx': return 'typescript'
    case 'py': return 'python'
    case 'json': return 'json'
    case 'sql': return 'sql'
    case 'sh': return 'bash'
    case 'cpp':
    case 'c': return 'cpp'
    case 'java': return 'java'
    default: return 'javascript'
  }
}

const Artifact = () => {
  const dispatch = useDispatch()
  const { activeArtifact } = useSelector((state) => state.message)

  const [activeTab, setActiveTab] = useState('preview')
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const files = useMemo(() => {
    return Array.isArray(activeArtifact?.files) ? activeArtifact.files : []
  }, [activeArtifact])

  const hasHtml = useMemo(() => {
    return files.some((f) => f.name && f.name.toLowerCase().endsWith('.html'))
  }, [files])

  useEffect(() => {
    if (activeArtifact) {
      if (hasHtml) {
        setActiveTab('preview')
      } else if (files.length > 0) {
        setActiveTab(files[0].name)
      }
    }
  }, [activeArtifact, hasHtml, files])

  const bundledHtml = useMemo(() => {
    if (!hasHtml) return ''
    const htmlFile = files.find((f) => f.name.toLowerCase().endsWith('.html'))
    const cssFile = files.find((f) => f.name.toLowerCase().endsWith('.css'))
    const jsFile = files.find((f) => f.name.toLowerCase().endsWith('.js'))

    let html = htmlFile?.content || '<!DOCTYPE html><html><head></head><body></body></html>'

    if (cssFile?.content) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${cssFile.content}\n</style></head>`)
      } else {
        html = `<style>\n${cssFile.content}\n</style>` + html
      }
    }

    if (jsFile?.content) {
      const scriptTag = `<script>\ntry {\n${jsFile.content}\n} catch(err) { console.error('Preview error:', err); }\n</script>`
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}</body>`)
      } else {
        html += scriptTag
      }
    }

    return html
  }, [files, hasHtml])

  if (!activeArtifact || files.length === 0) {
    return null
  }

  const currentFile = files.find((f) => f.name === activeTab) || files[0]

  const handleCopyCurrentFile = async () => {
    if (!currentFile?.content) return
    try {
      await navigator.clipboard.writeText(currentFile.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownloadAll = () => {
    files.forEach((file) => {
      const blob = new Blob([file.content || ''], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name || 'file.txt'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
  }

  const handleOpenInNewTab = () => {
    if (!bundledHtml) return
    const blob = new Blob([bundledHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div
      className={`fixed z-40 transition-all duration-300 ease-in-out flex flex-col bg-[#0b0d13] border-l border-white/[0.08] shadow-2xl ${
        isFullscreen
          ? 'inset-0 w-full h-full'
          : 'top-0 right-0 h-full w-full sm:w-[500px] md:w-[600px] lg:w-[680px] xl:w-[760px]'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#11141c] border-b border-white/[0.08] select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100 truncate">
                {activeArtifact.title || 'Interactive Project'}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shrink-0">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 truncate">
              {activeArtifact.type || 'Web Application'} • Live Artifact
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setPreviewKey((prev) => prev + 1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
                title="Reload Preview"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink size={14} />
              </button>
            </>
          )}

          {activeTab !== 'preview' && (
            <button
              type="button"
              onClick={handleCopyCurrentFile}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
              title="Copy current file content"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadAll}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
            title="Download project files"
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            type="button"
            onClick={() => dispatch(clearActiveArtifact())}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-white/[0.03] hover:bg-rose-500/10 border border-white/[0.06] transition-all cursor-pointer ml-1"
            title="Close Panel"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 bg-[#0e1017] border-b border-white/[0.06] overflow-x-auto [scrollbar-width:none]">
        {hasHtml && (
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'preview'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Play size={12} className={activeTab === 'preview' ? 'text-indigo-400 fill-indigo-400/30' : ''} />
            <span>Live Preview</span>
          </button>
        )}

        {files.map((file) => {
          const isSelected = activeTab === file.name
          return (
            <button
              key={file.name}
              type="button"
              onClick={() => setActiveTab(file.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 font-mono ${
                isSelected
                  ? 'bg-white/[0.1] text-white border border-white/[0.15]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <FileCode size={12} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
              <span>{file.name}</span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 bg-[#08090e] relative overflow-hidden">
        {activeTab === 'preview' && hasHtml ? (
          <div className="w-full h-full bg-white relative">
            <iframe
              key={previewKey}
              title="Artifact Preview"
              srcDoc={bundledHtml}
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="w-full h-full overflow-auto [scrollbar-width:thin]">
            <SyntaxHighlighter
              language={getLanguageFromFileName(currentFile?.name)}
              style={oneDark}
              showLineNumbers={true}
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                padding: '1.2rem 1.2rem',
                background: '#090b11',
                fontSize: '13px',
                lineHeight: '1.65',
                minHeight: '100%',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
              lineNumberStyle={{
                minWidth: '2.8em',
                paddingRight: '1em',
                color: '#475569',
                textAlign: 'right',
                userSelect: 'none',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                marginRight: '1em',
              }}
            >
              {currentFile?.content || '// No content in file'}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  )
}

export default Artifact