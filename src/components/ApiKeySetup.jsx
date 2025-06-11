import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
  Alert,
  List,
  ListItem,
  Chip,
} from '@material-tailwind/react';
import { 
  KeyIcon, 
  DocumentIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { ConfigService } from '../services/config.service';

export function ApiKeySetup({ onComplete }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [availableIndexes, setAvailableIndexes] = useState([]);
  const [showIndexes, setShowIndexes] = useState(false);

  useEffect(() => {
    // Verificar se há índices salvos
    const indexes = ConfigService.getAvailableIndexes();
    setAvailableIndexes(indexes);
    setShowIndexes(indexes.length > 0);
  }, []);

  const validateAndSaveKey = async () => {
    if (!ConfigService.validateApiKey(apiKey)) {
      setError('Formato de API key inválido. Deve começar com "sk-"');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Testar a API key
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key inválida ou expirada');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns segundos.');
        } else {
          throw new Error('Erro ao validar API key');
        }
      }

      // Verificar se tem acesso aos modelos necessários
      const models = await response.json();
      const hasEmbedding = models.data.some(m => m.id.includes('embedding'));
      const hasGPT4 = models.data.some(m => m.id.includes('gpt-4'));

      if (!hasEmbedding || !hasGPT4) {
        throw new Error('Sua API key precisa ter acesso aos modelos de embedding e GPT-4');
      }

      // Salvar e continuar
      ConfigService.saveApiKey(apiKey);
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const loadExistingIndex = () => {
    // Permitir uso sem API key se há índices salvos
    ConfigService.saveApiKey('sk-dummy-for-search-only');
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Card Principal */}
        <Card>
          <CardBody className="space-y-6">
            <div className="text-center">
              <KeyIcon className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <Typography variant="h4" color="blue-gray">
                Sistema RAG com OpenAI
              </Typography>
              <Typography color="gray" className="mt-2">
                Para processar novos documentos, você precisa fornecer sua API key da OpenAI
              </Typography>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  type="password"
                  label="API Key da OpenAI"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  error={!!error}
                  icon={<KeyIcon className="h-5 w-5" />}
                />
                {error && (
                  <Typography variant="small" color="red" className="mt-1 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    {error}
                  </Typography>
                )}
              </div>

              <Button
                onClick={validateAndSaveKey}
                disabled={!apiKey || isValidating}
                className="w-full"
                color="blue"
              >
                {isValidating ? 'Validando...' : 'Continuar com API Key'}
              </Button>

              <div className="text-center space-y-2">
                <Typography variant="small" color="gray">
                  Sua API key será armazenada apenas nesta sessão
                </Typography>
                <Typography variant="small">
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Obter API key →
                  </a>
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card de Índices Salvos */}
        {showIndexes && (
          <Card>
            <CardBody>
              <Typography variant="h6" className="mb-3 flex items-center gap-2">
                <DocumentIcon className="h-5 w-5" />
                Índices Salvos Encontrados
              </Typography>
              
              <Typography variant="small" color="gray" className="mb-3">
                Você pode usar índices salvos anteriormente sem precisar de API key
              </Typography>

              <List>
                {availableIndexes.map((index, idx) => (
                  <ListItem key={idx} className="p-2">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <Typography variant="small" className="font-medium">
                          {index.stats?.documentName || 'Documento'}
                        </Typography>
                        <Typography variant="small" color="gray">
                          {index.stats?.totalChunks} chunks • {new Date(index.created).toLocaleDateString()}
                        </Typography>
                      </div>
                      <Chip
                        value={`${index.stats?.pagesProcessed} páginas`}
                        size="sm"
                        color="blue"
                      />
                    </div>
                  </ListItem>
                ))}
              </List>

              <Button
                onClick={loadExistingIndex}
                variant="outlined"
                className="w-full mt-3"
                color="green"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Usar Apenas Índices Salvos
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Informações */}
        <Card className="bg-blue-50">
          <CardBody>
            <Typography variant="h6" className="mb-2">
              ℹ️ Informações Importantes
            </Typography>
            <ul className="space-y-1">
              <li>
                <Typography variant="small">
                  • Este sistema usa os modelos mais avançados da OpenAI
                </Typography>
              </li>
              <li>
                <Typography variant="small">
                  • Custo estimado: ~$0.13 por 1M tokens de embedding
                </Typography>
              </li>
              <li>
                <Typography variant="small">
                  • Seus documentos são processados localmente no navegador
                </Typography>
              </li>
              <li>
                <Typography variant="small">
                  • Índices podem ser salvos para uso futuro sem API key
                </Typography>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}