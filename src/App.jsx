import { useState } from 'react'
import { PDFUploader } from './components/PDFUploader'

function App() {
  const [extractedText, setExtractedText] = useState('')

  const handleTextExtracted = (text) => {
    setExtractedText(text)
    console.log('Texto extraído:', text.substring(0, 500) + '...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Gerador de Podcasts Educativos
          </h1>
          <p className="text-lg text-gray-600">
            Transforme seus PDFs em conversas educativas envolventes
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {!extractedText ? (
            <PDFUploader onTextExtracted={handleTextExtracted} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Texto Extraído com Sucesso!
              </h2>
              <div className="bg-gray-100 rounded p-4 mb-4 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {extractedText.substring(0, 1000)}...
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setExtractedText('')}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Carregar Novo PDF
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled
                >
                  Gerar Podcast (Em breve)
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App