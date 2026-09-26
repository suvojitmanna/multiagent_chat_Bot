import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setArtifactOpen, setActiveArtifact } from '../redux/messageSlice'
import { motion, AnimatePresence } from 'framer-motion'
import Editor from '@monaco-editor/react'
import {
  Play,
  Copy,
  Check,
  Download,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  FileCode,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  RotateCcw,
  Loader2,
  Code2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Image as ImageIcon,
  FileText
} from 'lucide-react'

const getMonacoLanguage = (name = '') => {
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
    case 'sh':
    case 'bash': return 'shell'
    case 'cpp':
    case 'c': return 'cpp'
    case 'java': return 'java'
    case 'md':
    case 'markdown': return 'markdown'
    case 'xml':
    case 'svg': return 'xml'
    case 'yml':
    case 'yaml': return 'yaml'
    case 'rs': return 'rust'
    case 'go': return 'go'
    case 'php': return 'php'
    default: return 'plaintext'
  }
}

const handleEditorWillMount = (monaco) => {
  monaco.editor.defineTheme('shifra-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c084fc' },
      { token: 'string', foreground: '34d399' },
      { token: 'number', foreground: 'fbbf24' },
      { token: 'tag', foreground: '818cf8' },
      { token: 'attribute.name', foreground: '38bdf8' },
    ],
    colors: {
      'editor.background': '#090b11',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#111420',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#818cf8',
      'editorCursor.foreground': '#818cf8',
      'editor.selectionBackground': '#312e81',
      'editor.inactiveSelectionBackground': '#1e1b4b',
      'scrollbarSlider.background': '#ffffff15',
      'scrollbarSlider.hoverBackground': '#ffffff25',
      'scrollbarSlider.activeBackground': '#ffffff35',
    },
  })

  monaco.editor.defineTheme('shifra-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7c3aed' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'd97706' },
      { token: 'tag', foreground: '4f46e5' },
      { token: 'attribute.name', foreground: '0284c7' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1e293b',
      'editor.lineHighlightBackground': '#f1f5f9',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#4f46e5',
      'editorCursor.foreground': '#4f46e5',
      'editor.selectionBackground': '#e0e7ff',
      'editor.inactiveSelectionBackground': '#f1f5f9',
    },
  })
}

const Artifact = () => {
  const dispatch = useDispatch()
  const { activeArtifact, visibleArtifact, isArtifactOpen, messages } = useSelector((state) => state.message)
  const isDark = useSelector((state) => state.theme?.isDark ?? true)

  const [activeTab, setActiveTab] = useState('preview')
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [editedFiles, setEditedFiles] = useState({})
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const isImageArtifact = Boolean(
    activeArtifact?.type === 'image' ||
    Boolean(activeArtifact?.imageUrl) ||
    (activeArtifact?.type === 'file' && activeArtifact?.fileType?.startsWith('image/')) ||
    (typeof activeArtifact?.title === 'string' && /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(activeArtifact.title))
  )

  const isPdfArtifact = Boolean(
    activeArtifact?.type === 'pdf' ||
    activeArtifact?.type === 'pdf_rag' ||
    Boolean(activeArtifact?.pdfUrl) ||
    (activeArtifact?.type === 'file' && activeArtifact?.fileType === 'application/pdf') ||
    (typeof activeArtifact?.title === 'string' && activeArtifact.title.toLowerCase().endsWith('.pdf'))
  )

  const currentArtifact = useMemo(() => {
    if (activeArtifact) {
      if (isImageArtifact || isPdfArtifact) return activeArtifact
      if (Array.isArray(activeArtifact.files) && activeArtifact.files.length > 0) {
        return activeArtifact
      }
    }
    const messageList = Array.isArray(messages) ? messages : (messages?.messages || [])
    for (let i = messageList.length - 1; i >= 0; i--) {
      const arts = messageList[i]?.artifacts
      if (Array.isArray(arts) && arts.length > 0) {
        return arts[0]
      }
    }
    return null
  }, [activeArtifact, messages, isImageArtifact, isPdfArtifact])

  const activePdfUrl = useMemo(() => {
    return (
      currentArtifact?.pdfUrl ||
      currentArtifact?.url ||
      (typeof window !== "undefined" && currentArtifact?.title && window.__pdfBlobCache?.get(currentArtifact.title)) ||
      null
    );
  }, [currentArtifact]);

  const activeImageUrl = useMemo(() => {
    return (
      currentArtifact?.imageUrl ||
      currentArtifact?.url ||
      (typeof window !== "undefined" && currentArtifact?.title && window.__imageBlobCache?.get(currentArtifact.title)) ||
      null
    );
  }, [currentArtifact]);

  useEffect(() => {
    setZoom(1)
    setRotation(0)
  }, [currentArtifact])

  const files = useMemo(() => {
    return Array.isArray(currentArtifact?.files) ? currentArtifact.files : []
  }, [currentArtifact])

  const hasHtml = useMemo(() => {
    return files.some((f) => f.name && f.name.toLowerCase().endsWith('.html'))
  }, [files])

  useEffect(() => {
    if (currentArtifact) {
      if (hasHtml) {
        setActiveTab('preview')
      } else if (files.length > 0) {
        setActiveTab(files[0].name)
      }
    }
  }, [currentArtifact, hasHtml, files])

  const getFileContent = useCallback((file) => {
    if (!file) return ''
    if (editedFiles[file.name] !== undefined) return editedFiles[file.name]
    return file.content || ''
  }, [editedFiles])

  const bundledHtml = useMemo(() => {
    if (!hasHtml) return ''
    const htmlFile = files.find((f) => f.name.toLowerCase().endsWith('.html'))
    const cssFile = files.find((f) => f.name.toLowerCase().endsWith('.css'))
    const jsFile = files.find((f) => f.name.toLowerCase().endsWith('.js'))

    let html = getFileContent(htmlFile) || '<!DOCTYPE html><html><head></head><body></body></html>'

    const cssContent = getFileContent(cssFile)
    if (cssContent) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${cssContent}\n</style></head>`)
      } else {
        html = `<style>\n${cssContent}\n</style>` + html
      }
    }

    const jsContent = getFileContent(jsFile)
    if (jsContent) {
      const scriptTag = `<script>\ntry {\n${jsContent}\n} catch(err) { console.error('Preview error:', err); }\n</script>`
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}</body>`)
      } else {
        html += scriptTag
      }
    }

    return html
  }, [files, hasHtml, getFileContent])

  const resolvedTitle = useMemo(() => {
    if (isImageArtifact) {
      return currentArtifact?.title || 'Attached Image'
    }
    if (isPdfArtifact) {
      return currentArtifact?.title || 'Attached PDF Document'
    }
    if (
      currentArtifact?.title &&
      currentArtifact.title.trim() &&
      !['interactive project', 'project', 'web project', 'generated web project'].includes(
        currentArtifact.title.trim().toLowerCase()
      )
    ) {
      return currentArtifact.title.trim()
    }
    const htmlFile = files.find((f) => f.name && f.name.toLowerCase().endsWith('.html'))
    const htmlContent = getFileContent(htmlFile)
    if (htmlContent) {
      const match = /<title>(.*?)<\/title>/i.exec(htmlContent)
      if (match && match[1]?.trim()) {
        const title = match[1].trim()
        if (!['document', 'untitled', 'index', 'my project'].includes(title.toLowerCase())) {
          return title
        }
      }
    }
    return currentArtifact?.title || 'Interactive Project'
  }, [currentArtifact, files, getFileContent, isImageArtifact, isPdfArtifact])

  const currentFile = files.find((f) => f.name === activeTab) || files[0]
  const currentCode = getFileContent(currentFile)
  const isCurrentFileEdited = currentFile ? editedFiles[currentFile.name] !== undefined : false

  const handleCodeChange = (newCode) => {
    if (!currentFile?.name) return
    setEditedFiles((prev) => ({
      ...prev,
      [currentFile.name]: newCode ?? '',
    }))
  }

  const handleResetCurrentFile = () => {
    if (!currentFile?.name) return
    setEditedFiles((prev) => {
      const next = { ...prev }
      delete next[currentFile.name]
      return next
    })
  }

  const handleCopyCurrentFile = async () => {
    if (!currentCode) return
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownloadAll = () => {
    files.forEach((file) => {
      const content = getFileContent(file)
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
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

  const handleDownloadArtifact = () => {
    if (isImageArtifact) {
      const url = activeImageUrl || currentArtifact?.imageUrl || currentArtifact?.url
      if (!url) return
      const link = document.createElement('a')
      link.href = url
      link.download = resolvedTitle || 'image.png'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }
    if (isPdfArtifact) {
      const url = activePdfUrl || currentArtifact?.pdfUrl || currentArtifact?.url
      if (!url) return
      const link = document.createElement('a')
      link.href = url
      link.download = resolvedTitle || 'document.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }
    handleDownloadAll()
  }

  const handleOpenDrawer = () => {
    const targetArtifact = visibleArtifact || currentArtifact
    if (targetArtifact) {
      dispatch(setActiveArtifact({ ...targetArtifact, title: visibleArtifact?.title || resolvedTitle }))
    }
    dispatch(setArtifactOpen(true))
  }

  const handleCloseDrawer = () => {
    dispatch(setArtifactOpen(false))
  }

  const isVerticalTabVisible = Boolean((visibleArtifact || activeArtifact) && !isArtifactOpen)
  const isDrawerAvailable = Boolean(
    (activeArtifact || visibleArtifact || currentArtifact) &&
    (files.length > 0 || isImageArtifact || isPdfArtifact)
  )
  const displayTitle = visibleArtifact?.title || resolvedTitle || (isImageArtifact ? 'Attached Image' : (isPdfArtifact ? 'PDF Document' : 'Interactive Project'))

  return (
    <>
      <AnimatePresence>
        {isVerticalTabVisible && (
          <motion.button
            key="vertical-artifact-tab"
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            whileHover={{ x: -3, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            onClick={handleOpenDrawer}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 py-3.5 px-2 rounded-l-2xl bg-white/95 dark:bg-[#0f121d]/95 hover:bg-slate-50 dark:hover:bg-[#141827] border-y border-l border-indigo-400/50 dark:border-indigo-500/40 hover:border-indigo-500 shadow-xl shadow-indigo-500/10 backdrop-blur-md cursor-pointer transition-colors duration-200 group select-none"
            title={`Open: ${displayTitle}`}
          >
            <div className="w-7 h-7 rounded-xl bg-linear-to-br from-indigo-500/25 to-violet-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:scale-105 transition-all shadow-xs">
              {isImageArtifact ? (
                <ImageIcon size={13} />
              ) : isPdfArtifact ? (
                <FileText size={13} />
              ) : (
                <Sparkles size={13} />
              )}
            </div>

            <div className="flex items-center justify-center py-1">
              <span className="[writing-mode:vertical-rl] rotate-180 text-[12.5px] font-semibold tracking-wide text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white max-h-52 truncate">
                {displayTitle}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <ChevronLeft size={13} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:-translate-x-0.5 transition-transform" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDrawerAvailable && isArtifactOpen && (
          <motion.div
            key="artifact-drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className={`fixed z-40 flex flex-col bg-white dark:bg-[#0b0d13] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl ${isFullscreen
              ? 'inset-0 w-full h-full'
              : 'top-0 right-0 h-full w-full sm:w-[500px] md:w-[600px] lg:w-[680px] xl:w-[760px]'
              }`}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#11141c] border-b border-slate-200 dark:border-white/[0.08] select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                  {isImageArtifact ? (
                    <ImageIcon size={16} />
                  ) : isPdfArtifact ? (
                    <FileText size={16} className="text-rose-500" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {resolvedTitle}
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shrink-0">
                      {isImageArtifact ? 'Image' : isPdfArtifact ? 'PDF Document' : `${files.length} ${files.length === 1 ? 'file' : 'files'}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {isImageArtifact
                      ? `${Math.round(zoom * 100)}% zoom • Interactive Viewer`
                      : isPdfArtifact
                      ? 'Custom Vector DB • Indexed Document'
                      : `${currentArtifact.type || 'Web Application'} • Live Artifact`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isImageArtifact && (
                  <>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.2).toFixed(1))))}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setZoom(1)}
                      className="px-2 py-1 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Reset Zoom (100%)"
                    >
                      {Math.round(zoom * 100)}%
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw size={14} />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        const url = currentArtifact.imageUrl || currentArtifact.url
                        if (url) window.open(url, '_blank')
                      }}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Open full size in new tab"
                    >
                      <ExternalLink size={14} />
                    </motion.button>
                  </>
                )}

                {isPdfArtifact && (
                  <>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        const url = currentArtifact.pdfUrl || currentArtifact.url
                        if (url) window.open(url, '_blank')
                      }}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Open PDF in new tab"
                    >
                      <ExternalLink size={14} />
                    </motion.button>
                  </>
                )}

                {!isImageArtifact && !isPdfArtifact && activeTab === 'preview' && (
                  <>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setPreviewKey((prev) => prev + 1)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Reload Preview"
                    >
                      <RefreshCw size={14} />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleOpenInNewTab}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Open in new window"
                    >
                      <ExternalLink size={14} />
                    </motion.button>
                  </>
                )}

                {!isImageArtifact && !isPdfArtifact && activeTab !== 'preview' && (
                  <>
                    {isCurrentFileEdited && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetCurrentFile}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                        title="Reset file to original version"
                      >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                      </motion.button>
                    )}

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleCopyCurrentFile}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/60 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                      title="Copy current file content"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </motion.button>
                  </>
                )}

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleDownloadArtifact}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                  title="Download artifact"
                >
                  <Download size={14} />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleCloseDrawer}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-200/60 dark:bg-white/[0.03] hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/[0.06] transition-colors cursor-pointer ml-1"
                  title="Close Panel"
                >
                  <X size={15} />
                </motion.button>
              </div>
            </div>

            {isImageArtifact && (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-[#0e1017] border-b border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] truncate max-w-md">
                  {resolvedTitle}
                </span>
                <span className="text-[11px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                  {Math.round(zoom * 100)}% zoom
                </span>
              </div>
            )}

            {isPdfArtifact && (
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-[#0e1017] border-b border-slate-200 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <FileText size={13} className="text-rose-500 shrink-0" />
                  <span className="font-mono text-[11px] truncate max-w-md">
                    {resolvedTitle}
                  </span>
                </div>
                <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0">
                  Custom Vector DB
                </span>
              </div>
            )}

            {!isImageArtifact && !isPdfArtifact && files.length > 0 && (
              <div className="flex items-center justify-between gap-1 px-3 py-2 bg-slate-100 dark:bg-[#0e1017] border-b border-slate-200 dark:border-white/[0.06] overflow-x-auto [scrollbar-width:none]">
                <div className="flex items-center gap-1 min-w-0">
                  {hasHtml && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${activeTab === 'preview'
                        ? 'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40 dark:border-indigo-500/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
                        }`}
                    >
                      <Play size={12} className={activeTab === 'preview' ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-500/20 dark:fill-indigo-400/30' : ''} />
                      <span>Live Preview</span>
                    </motion.button>
                  )}

                  {files.map((file) => {
                    const isSelected = activeTab === file.name
                    const isFileEdited = editedFiles[file.name] !== undefined
                    return (
                      <motion.button
                        key={file.name}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setActiveTab(file.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 font-mono ${isSelected
                          ? 'bg-white dark:bg-white/[0.1] text-slate-800 dark:text-white border border-slate-300 dark:border-white/[0.15] shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
                          }`}
                      >
                        <FileCode size={12} className={isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                        <span>{file.name}</span>
                        {isFileEdited && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" title="Modified" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 bg-slate-50 dark:bg-[#08090e] relative overflow-hidden">
              {isImageArtifact ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#090b10] overflow-auto select-none">
                  {activeImageUrl ? (
                    <div
                      className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <img
                        src={activeImageUrl}
                        alt={resolvedTitle}
                        className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10 ring-1 ring-white/5"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-6 text-center">
                      <ImageIcon size={48} className="text-indigo-400 animate-pulse" />
                      <p className="font-semibold text-slate-200 text-sm">{resolvedTitle}</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Attached image analyzed by multi-agent vision system.
                      </p>
                    </div>
                  )}
                </div>
              ) : isPdfArtifact ? (
                <div className="w-full h-full bg-slate-900 relative">
                  {activePdfUrl ? (
                    <iframe
                      src={activePdfUrl}
                      title={resolvedTitle || "PDF Document Viewer"}
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-6 text-center">
                      <FileText size={48} className="text-rose-400 animate-pulse" />
                      <p className="font-semibold text-slate-200 text-sm">{resolvedTitle}</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        PDF document indexed into custom in-memory vector database.
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'preview' && hasHtml ? (
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
                <div className="w-full h-full relative bg-white dark:bg-[#090b11]">
                  <Editor
                    height="100%"
                    language={getMonacoLanguage(currentFile?.name)}
                    value={currentCode}
                    theme={isDark ? "shifra-dark" : "shifra-light"}
                    beforeMount={handleEditorWillMount}
                    onChange={handleCodeChange}
                    loading={
                      <div className="flex items-center justify-center h-full w-full bg-white dark:bg-[#090b11] text-slate-500 dark:text-slate-400 gap-2 text-xs">
                        <Loader2 size={16} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                        <span>Loading...</span>
                      </div>
                    }
                    options={{
                      fontSize: 13,
                      lineHeight: 21,
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                      minimap: { enabled: isFullscreen },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      automaticLayout: true,
                      tabSize: 2,
                      renderLineHighlight: 'all',
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      bracketPairColorization: { enabled: true },
                      cursorBlinking: 'smooth',
                      smoothScrolling: true,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Artifact