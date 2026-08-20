import { useEffect } from 'react'
import { useOrgSettings } from '@/lib/org-format'
import { t } from '@/lib/i18n'

const originals = new WeakMap<Text, string>()
const ATTRS = ['placeholder', 'title', 'aria-label'] as const

function translateTree(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode() as Text | null
  while (node) {
    const parent = node.parentElement
    if (parent && !['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION'].includes(parent.tagName)) {
      const original = originals.get(node) ?? node.nodeValue ?? ''
      if (!originals.has(node)) originals.set(node, original)
      const key = original.trim()
      if (key) node.nodeValue = original.replace(key, t(key))
    }
    node = walker.nextNode() as Text | null
  }
  root.querySelectorAll?.<HTMLElement>('[placeholder],[title],[aria-label]').forEach(element => {
    ATTRS.forEach(attr => {
      const value = element.getAttribute(attr); if (!value) return
      const dataKey = `i18n${attr.replace(/(^|-)(\w)/g, (_m, _p, c) => c.toUpperCase())}`
      const original = element.dataset[dataKey] || value
      element.dataset[dataKey] = original
      element.setAttribute(attr, t(original))
    })
  })
}

export function LiveTranslation() {
  const settings = useOrgSettings()
  useEffect(() => {
    const root = document.querySelector('main'); if (!root) return
    translateTree(root)
    const observer = new MutationObserver(entries => entries.forEach(entry => entry.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) translateTree(node as Element)
      else if (node.nodeType === Node.TEXT_NODE && node.parentNode) translateTree(node.parentNode)
    })))
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [settings.language])
  return null
}
