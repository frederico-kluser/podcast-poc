import { useState } from 'react'
import { PDFUploader } from './components/PDFUploader'
import {
  Card,
  CardBody,
  Typography,
  Button,
  Textarea,
  Spinner,
} from '@material-tailwind/react'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

function App() {
  const [extractedText, setExtractedText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [gptResponse, setGptResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleTextExtracted = (text) => {
    setExtractedText(text)
    console.log('Texto extraído:', text.substring(0, 500) + '...')
  }

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return
    
    setIsLoading(true)
    setGptResponse('')
    
    // TODO: Implementar chamada para API do ChatGPT
    // Por enquanto, vamos simular uma resposta
    setTimeout(() => {
      setGptResponse('Esta é uma resposta simulada do ChatGPT. A integração real com a API será implementada em breve.')
      setIsLoading(false)
    }, 2000)
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
            <div className="space-y-6">
              {/* Container do texto extraído */}
              <Card>
                <CardBody>
                  <Typography variant="h4" color="blue-gray" className="mb-4">
                    Texto Extraído com Sucesso!
                  </Typography>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
                    <Typography className="text-sm text-gray-700 whitespace-pre-wrap">
                      {extractedText.substring(0, 1000)}...
                    </Typography>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        setExtractedText('')
                        setPrompt('')
                        setGptResponse('')
                      }}
                      variant="outlined"
                      className="flex items-center gap-2"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Carregar Novo PDF
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Container do ChatGPT */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="h-6 w-6 text-blue-500" />
                    <Typography variant="h5" color="blue-gray">
                      Assistente ChatGPT
                    </Typography>
                  </div>
                  
                  {/* Área de resposta do ChatGPT com scroll */}
                  {gptResponse && (
                    <div className="mb-4 max-h-80 overflow-y-auto bg-blue-50 rounded-lg p-4">
                      <Typography className="text-gray-800 whitespace-pre-wrap">
                        {gptResponse}
                      </Typography>
                    </div>
                  )}
                  
                  {/* Loading spinner */}
                  {isLoading && (
                    <div className="mb-4 flex justify-center">
                      <Spinner className="h-8 w-8" color="blue" />
                    </div>
                  )}
                  
                  {/* Input do prompt */}
                  <div className="space-y-4">
                    <Textarea
                      label="Digite seu prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                      labelProps={{
                        className: "before:content-none after:content-none",
                      }}
                      placeholder="Ex: Resuma os principais pontos deste texto..."
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSubmitPrompt}
                      disabled={!prompt.trim() || isLoading}
                      className="w-full flex items-center justify-center gap-2"
                      color="blue"
                    >
                      <SparklesIcon className="h-5 w-5" />
                      Enviar para ChatGPT
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App