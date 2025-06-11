import React, { useState } from 'react';
import { ThemeProvider } from '@material-tailwind/react';
import { ApiKeySetup } from './components/ApiKeySetup';
import { HighQualityRAG } from './components/HighQualityRAG';
import { ConfigService } from './services/config.service';

function App() {
  const [hasApiKey, setHasApiKey] = useState(ConfigService.hasApiKey());

  const handleApiKeySetup = () => {
    setHasApiKey(true);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
        {!hasApiKey ? (
          <ApiKeySetup onComplete={handleApiKeySetup} />
        ) : (
          <HighQualityRAG />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;