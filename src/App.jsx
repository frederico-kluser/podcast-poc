import { useState, useRef } from 'react'
import { PDFUploader } from './components/PDFUploader'
import {
  Card,
  CardBody,
  Typography,
  Button,
  Textarea,
  Spinner,
  IconButton,
} from '@material-tailwind/react'
import { SparklesIcon, ArrowPathIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

function App() {
  const [extractedText, setExtractedText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [gptResponse, setGptResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleTextExtracted = (text) => {
    setExtractedText(text)
    console.log('Texto extraído:', text.substring(0, 500) + '...')
  }

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return
    
    setIsLoading(true)
    setGptResponse('')
    
    try {
      // Inicializar o modelo ChatGPT-4
      const model = new ChatOpenAI({
        openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
        modelName: 'gpt-4.1', // Usando GPT-4 Turbo mais recente
        temperature: 0,
        streaming: true,
      })

      // Criar as mensagens para o contexto
      const messages = [
        new SystemMessage(`Você é um assistente útil. Aqui está o contexto do documento PDF extraído:\n\n${extractedText.substring(0, 3000)}...`),
        new HumanMessage(prompt)
      ]

      // Fazer a chamada com streaming
      const stream = await model.stream(messages)
      
      let fullResponse = ''
      for await (const chunk of stream) {
        const content = chunk.content
        if (typeof content === 'string') {
          fullResponse += content
          setGptResponse(fullResponse)
        }
      }
      
    } catch (error) {
      console.error('Erro ao chamar ChatGPT:', error)
      setGptResponse('Erro ao processar sua solicitação. Por favor, tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true)
    
    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      formData.append('model', 'whisper-1')
      formData.append('language', 'pt')

      // Chamar API do OpenAI Whisper diretamente
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro na transcrição')
      }

      const data = await response.json()
      setPrompt(data.text)
      
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error)
      alert('Erro ao transcrever o áudio. Tente novamente.')
    } finally {
      setIsTranscribing(false)
    }
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
                  
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-red-500">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                      <Typography className="text-sm font-medium">
                        Gravando... Clique em parar quando terminar
                      </Typography>
                    </div>
                  )}
                  
                  {/* Input do prompt */}
                  <div className="space-y-4">
                    <Textarea
                      label="Digite seu prompt"
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value)
                        // Limpar resposta anterior ao começar a digitar novo prompt
                        if (gptResponse && e.target.value !== prompt) {
                          setGptResponse('')
                        }
                      }}
                      rows={4}
                      className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                      labelProps={{
                        className: "before:content-none after:content-none",
                      }}
                      placeholder="Ex: Resuma os principais pontos deste texto..."
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmitPrompt}
                        disabled={!prompt.trim() || isLoading || isTranscribing}
                        className="flex-1 flex items-center justify-center gap-2"
                        color="blue"
                      >
                        <SparklesIcon className="h-5 w-5" />
                        Enviar para ChatGPT
                      </Button>
                      
                      {!isRecording ? (
                        <IconButton
                          onClick={startRecording}
                          disabled={isLoading || isTranscribing}
                          color="blue"
                          variant="outlined"
                          className="shrink-0"
                        >
                          {isTranscribing ? (
                            <Spinner className="h-5 w-5" />
                          ) : (
                            <MicrophoneIcon className="h-5 w-5" />
                          )}
                        </IconButton>
                      ) : (
                        <IconButton
                          onClick={stopRecording}
                          color="red"
                          className="shrink-0 animate-pulse"
                        >
                          <StopIcon className="h-5 w-5" />
                        </IconButton>
                      )}
                    </div>
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