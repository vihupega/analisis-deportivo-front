import { useState } from 'react'
import QuinielaList from './QuinielaList.jsx'
import QuinielaDetail from './QuinielaDetail.jsx'
import ProgolImportPanel from './ProgolImportPanel.jsx'
import CustomBuilder from './CustomBuilder.jsx'

// Contenedor de la pestaña Quinielas. Sub-navegación local (Progol / Personalizada)
// con dos ejes de estado: sub y vista. No toca prefill ni el resto de App.jsx.
export default function QuinielasTab() {
  const [sub, setSub]           = useState('progol')       // 'progol' | 'custom'
  const [vista, setVista]       = useState('list')          // 'list' | 'detail'
  const [selectedId, setSelectedId] = useState(null)
  const [showCreator, setShowCreator] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  function changeSub(newSub) {
    setSub(newSub)
    setVista('list')
    setSelectedId(null)
    setShowCreator(false)
  }

  function openDetail(id) {
    setSelectedId(id)
    setVista('detail')
    setShowCreator(false)
  }

  function backToList() {
    setVista('list')
    setSelectedId(null)
    setRefreshToken(t => t + 1)
  }

  return (
    <div>
      <div className="toggle-group quin-sub-nav">
        <button type="button" className={`toggle-btn ${sub === 'progol' ? 'active' : ''}`} onClick={() => changeSub('progol')}>
          Progol
        </button>
        <button type="button" className={`toggle-btn ${sub === 'custom' ? 'active' : ''}`} onClick={() => changeSub('custom')}>
          Personalizada
        </button>
      </div>

      {vista === 'detail' && selectedId ? (
        <QuinielaDetail
          quinielaId={selectedId}
          variant={sub}
          onBack={backToList}
          onDeleted={backToList}
        />
      ) : (
        <>
          {sub === 'progol' ? (
            <ProgolImportPanel onImported={(q) => openDetail(q.id)} />
          ) : (
            <div className="row" style={{ marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreator(s => !s)}>
                {showCreator ? 'Cerrar' : '+ Nueva quiniela personalizada'}
              </button>
            </div>
          )}

          {sub === 'custom' && showCreator && (
            <CustomBuilder mode="create" onCreated={(q) => openDetail(q.id)} />
          )}

          <QuinielaList variant={sub} onSelect={openDetail} refreshToken={refreshToken} />
        </>
      )}
    </div>
  )
}
