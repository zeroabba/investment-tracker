import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, DollarSign, Upload, Download, CheckCircle, Calendar, Target, Award } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InvestmentTracker() {
  const [currentTab, setCurrentTab] = useState('upload');
  const [data, setData] = useState({
    positions: [],
    closed: []
  });
  const [fileName, setFileName] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem('investmentData');
    if (saved) {
      setData(JSON.parse(saved));
      setLastUpdate(localStorage.getItem('lastUpdate') || '');
    }
  }, []);

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (data.positions.length > 0 || data.closed.length > 0) {
      localStorage.setItem('investmentData', JSON.stringify(data));
      localStorage.setItem('lastUpdate', lastUpdate);
    }
  }, [data, lastUpdate]);

  // 엑셀 파일 읽기
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLastUpdate(new Date().toLocaleString('ko-KR'));

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        
        // 포지션 목록 읽기 (Scanner의 "포지션목록_템플릿"도 지원!)
        const positionsSheet = workbook.Sheets['포지션목록_템플릿'] || 
                               workbook.Sheets['포지션목록'] || 
                               {};
        const positions = XLSX.utils.sheet_to_json(positionsSheet);

        // 청산 기록 읽기
        const closedSheet = workbook.Sheets['청산기록'] || {};
        const closed = XLSX.utils.sheet_to_json(closedSheet);

        setData({
          positions: positions.map((p, idx) => ({
            id: p.포지션ID || idx + 1,
            ticker: p.종목코드 || '',
            name: p.종목명 || '',
            strategy: p.전략 || '',
            entryDate: formatDate(p.진입일),
            entryPrice: p.진입가 || 0,
            quantity: p.수량 || 0,
            investment: p.투자금 || 0,
            targetPrice: p.목표가 || 0,
            stopPrice: p.손절가 || 0,
            plannedDays: p.계획보유일 || 0,
            plannedExitDate: formatDate(p.청산예정일),
            expectedReturn: p.예상수익률 || 0,
            winRate: p.백테스트승률 || 0,
            entryReason: p.진입사유 || '',
            status: p.상태 || '보유중',
            currentPrice: p.현재가 || p.진입가 || 0
          })),
          closed: closed.map((c, idx) => ({
            id: c.포지션ID || idx + 1,
            ticker: c.종목코드 || '',
            name: c.종목명 || '',
            strategy: c.전략 || '',
            entryDate: formatDate(c.진입일),
            exitDate: formatDate(c.청산일),
            entryPrice: c.진입가 || 0,
            exitPrice: c.청산가 || 0,
            quantity: c.수량 || 0,
            actualDays: c.실제보유일 || 0,
            actualReturn: c.실제수익률 || 0,
            actualProfit: c.실제손익 || 0,
            exitReason: c.청산이유 || '',
            plannedExitPrice: c.계획청산가 || 0,
            plannedProfit: c.계획대로손익 || 0,
            disciplineLoss: c.규율손익 || 0,
            disciplineScore: c.규율점수 || 0,
            disciplineGrade: c.규율등급 || ''
          }))
        });

        alert('엑셀 파일을 성공적으로 불러왔습니다!');
      } catch (error) {
        alert('파일 읽기 오류: ' + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 날짜 포맷 변환
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'number') {
      const d = new Date((date - 25569) * 86400 * 1000);
      return d.toISOString().split('T')[0];
    }
    if (typeof date === 'string' && date.includes('/')) {
      const parts = date.split('/');
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    return date;
  };

  // 엑셀 템플릿 다운로드
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // 포지션 목록 시트
    const positionData = [
      ['포지션ID', '종목코드', '종목명', '전략', '진입일', '진입가', '수량', '투자금', '목표가', '손절가', '계획보유일', '청산예정일', '예상수익률', '백테스트승률', '진입사유', '상태', '현재가'],
      [1, '000660', 'SK하이닉스', '추세추종', '2026-01-02', 677000, 10, 6770000, 715000, 452000, 20, '2026-01-27', 5.61, 63.6, '스캔 결과 상위', '보유중', 677000],
      [2, '005930', '삼성전자', '변동성돌파', '2026-01-03', 50000, 40, 2000000, 53900, 40600, 5, '2026-01-10', 7.8, 84.2, '강한 시그널', '보유중', 50000]
    ];
    const wsPosition = XLSX.utils.aoa_to_sheet(positionData);
    XLSX.utils.book_append_sheet(wb, wsPosition, '포지션목록');

    // 청산 기록 시트
    const closedData = [
      ['포지션ID', '종목코드', '종목명', '전략', '진입일', '청산일', '진입가', '청산가', '수량', '실제보유일', '실제수익률', '실제손익', '청산이유', '계획청산가', '계획대로손익', '규율손익', '규율점수', '규율등급'],
      [99, '035720', '카카오', '추세추종', '2025-12-01', '2025-12-15', 45000, 47000, 20, 14, 4.44, 40000, '조기익절', 48600, 72000, -32000, 61.7, 'D']
    ];
    const wsClosed = XLSX.utils.aoa_to_sheet(closedData);
    XLSX.utils.book_append_sheet(wb, wsClosed, '청산기록');

    XLSX.writeFile(wb, 'CALM_투자일지_템플릿.xlsx');
  };

  // 엑셀 내보내기 (수식 포함!)
  const exportToExcel = () => {
    if (data.positions.length === 0 && data.closed.length === 0) {
      alert('먼저 데이터를 입력하거나 불러오세요.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // ========================================
    // 포지션 목록 (수식 포함!)
    // ========================================
    const positionExport = data.positions.map(p => ({
      '포지션ID': p.id,
      '종목코드': p.ticker,
      '종목명': p.name,
      '전략': p.strategy,
      '진입일': p.entryDate,
      '진입가': p.entryPrice,
      '수량': p.quantity,
      '투자금': p.investment,
      '목표가': p.targetPrice,
      '손절가': p.stopPrice,
      '계획보유일': p.plannedDays,
      '청산예정일': p.plannedExitDate,
      '예상수익률': p.expectedReturn,
      '백테스트승률': p.winRate,
      '진입사유': p.entryReason,
      '상태': p.status,
      '현재가': p.currentPrice
    }));
    
    const wsPosition = XLSX.utils.json_to_sheet(positionExport);
    
    // 수식 추가!
    data.positions.forEach((p, idx) => {
      const row = idx + 2; // 헤더 제외
      
      // H열: 투자금 = F × G (진입가 × 수량)
      wsPosition[`H${row}`] = { 
        t: 'n',
        f: `F${row}*G${row}`,
        v: p.investment
      };
      
      // I열: 목표가 = F × (1 + M/100) (진입가 × (1 + 예상수익률/100))
      wsPosition[`I${row}`] = {
        t: 'n',
        f: `F${row}*(1+M${row}/100)`,
        v: p.targetPrice
      };
      
      // J열: 손절가 = 진입가 × (1 + 손실률/100)
      // 손실률은 고정값으로 계산 (백테스트 최대손실 사용)
      const lossRate = p.stopPrice > 0 ? ((p.stopPrice / p.entryPrice - 1) * 100).toFixed(2) : -10;
      wsPosition[`J${row}`] = {
        t: 'n',
        f: `F${row}*(1+${lossRate}/100)`,
        v: p.stopPrice
      };
      
      // L열: 청산예정일 = E + K (진입일 + 계획보유일)
      // Excel 날짜 수식
      if (p.entryDate && p.plannedDays) {
        wsPosition[`L${row}`] = {
          t: 'd',
          f: `E${row}+K${row}`,
          v: p.plannedExitDate
        };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, wsPosition, '포지션목록');

    // ========================================
    // 청산 기록
    // ========================================
    const closedExport = data.closed.map(c => ({
      '포지션ID': c.id,
      '종목코드': c.ticker,
      '종목명': c.name,
      '전략': c.strategy,
      '진입일': c.entryDate,
      '청산일': c.exitDate,
      '진입가': c.entryPrice,
      '청산가': c.exitPrice,
      '수량': c.quantity,
      '실제보유일': c.actualDays,
      '실제수익률': c.actualReturn,
      '실제손익': c.actualProfit,
      '청산이유': c.exitReason,
      '계획청산가': c.plannedExitPrice,
      '계획대로손익': c.plannedProfit,
      '규율손익': c.disciplineLoss,
      '규율점수': c.disciplineScore,
      '규율등급': c.disciplineGrade
    }));
    const wsClosed = XLSX.utils.json_to_sheet(closedExport);
    XLSX.utils.book_append_sheet(wb, wsClosed, '청산기록');

    XLSX.writeFile(wb, `CALM_투자일지_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 현재가 업데이트
  const updateCurrentPrice = (positionId, newPrice) => {
    setData(prev => ({
      ...prev,
      positions: prev.positions.map(p =>
        p.id === positionId ? { ...p, currentPrice: newPrice } : p
      )
    }));
  };

  // 청산 처리
  const closePosition = (positionId, exitPrice, exitReason, plannedExitPrice) => {
    const position = data.positions.find(p => p.id === positionId);
    if (!position) return;

    const today = new Date();
    const entryDate = new Date(position.entryDate);
    const actualDays = Math.ceil((today - entryDate) / (1000 * 60 * 60 * 24));
    
    const actualReturn = ((exitPrice / position.entryPrice) - 1) * 100;
    const actualProfit = (exitPrice - position.entryPrice) * position.quantity;
    
    const plannedProfit = (plannedExitPrice - position.entryPrice) * position.quantity;
    const disciplineLoss = actualProfit - plannedProfit;
    
    const disciplineScore = ((actualReturn / position.expectedReturn) * 50) + 
                           ((actualDays / position.plannedDays) * 50);
    
    const disciplineGrade = 
      disciplineScore >= 90 ? 'A' :
      disciplineScore >= 80 ? 'B' :
      disciplineScore >= 70 ? 'C' :
      disciplineScore >= 60 ? 'D' : 'F';

    const closedPosition = {
      id: position.id,
      ticker: position.ticker,
      name: position.name,
      strategy: position.strategy,
      entryDate: position.entryDate,
      exitDate: today.toISOString().split('T')[0],
      entryPrice: position.entryPrice,
      exitPrice: exitPrice,
      quantity: position.quantity,
      actualDays: actualDays,
      actualReturn: actualReturn,
      actualProfit: actualProfit,
      exitReason: exitReason,
      plannedExitPrice: plannedExitPrice,
      plannedProfit: plannedProfit,
      disciplineLoss: disciplineLoss,
      disciplineScore: disciplineScore,
      disciplineGrade: disciplineGrade
    };

    setData(prev => ({
      positions: prev.positions.filter(p => p.id !== positionId),
      closed: [...prev.closed, closedPosition]
    }));

    setLastUpdate(new Date().toLocaleString('ko-KR'));
    alert('청산이 완료되었습니다!');
  };

  // 통계 계산
  const getStatistics = () => {
    const totalPositions = data.positions.length;
    const totalInvestment = data.positions.reduce((sum, p) => sum + p.investment, 0);
    const totalClosed = data.closed.length;
    const winningTrades = data.closed.filter(c => c.actualReturn > 0).length;
    const winRate = totalClosed > 0 ? (winningTrades / totalClosed * 100) : 0;
    const totalProfit = data.closed.reduce((sum, c) => sum + c.actualProfit, 0);
    const avgDisciplineScore = totalClosed > 0 
      ? data.closed.reduce((sum, c) => sum + c.disciplineScore, 0) / totalClosed 
      : 0;
    const totalDisciplineLoss = data.closed.reduce((sum, c) => sum + c.disciplineLoss, 0);

    return { 
      totalPositions, 
      totalInvestment, 
      totalClosed, 
      winRate, 
      totalProfit,
      avgDisciplineScore,
      totalDisciplineLoss
    };
  };

  const stats = getStatistics();

  // D-Day 계산
  const getDday = (targetDate) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 규율 위반 케이스 분석
  const getDisciplineIssues = () => {
    const issues = data.closed.filter(c => c.disciplineLoss < -10000);
    return issues.sort((a, b) => a.disciplineLoss - b.disciplineLoss);
  };

  const disciplineIssues = getDisciplineIssues();

  // 청산 이유별 통계
  const getExitReasonStats = () => {
    const reasons = {};
    data.closed.forEach(c => {
      if (!reasons[c.exitReason]) {
        reasons[c.exitReason] = { count: 0, totalProfit: 0 };
      }
      reasons[c.exitReason].count++;
      reasons[c.exitReason].totalProfit += c.actualProfit;
    });
    return Object.entries(reasons).map(([reason, stats]) => ({
      reason,
      count: stats.count,
      avgProfit: stats.totalProfit / stats.count
    }));
  };

  const exitReasonStats = getExitReasonStats();

  // 청산 처리 컴포넌트
  const ClosePositionCard = ({ position }) => {
    const [exitPrice, setExitPrice] = useState(position.currentPrice);
    const [exitReason, setExitReason] = useState('목표달성');
    const [plannedPrice, setPlannedPrice] = useState(position.targetPrice);
    
    const previewReturn = ((exitPrice / position.entryPrice) - 1) * 100;
    const previewProfit = (exitPrice - position.entryPrice) * position.quantity;
    const plannedProfit = (plannedPrice - position.entryPrice) * position.quantity;
    const previewDisciplineLoss = previewProfit - plannedProfit;

    return (
      <div className="border-2 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {position.name} ({position.ticker})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                청산가 입력
              </label>
              <input
                type="number"
                value={exitPrice}
                onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 outline-none text-lg"
                placeholder="청산 가격"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                청산 이유
              </label>
              <select
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="목표달성">목표달성 (계획대로)</option>
                <option value="조기익절">조기익절 (목표 전 청산)</option>
                <option value="손절">손절 (계획대로)</option>
                <option value="조기손절">조기손절 (손절 전 청산)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                계획대로 청산가 (비교용)
              </label>
              <input
                type="number"
                value={plannedPrice}
                onChange={(e) => setPlannedPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 outline-none"
                placeholder="계획했던 가격"
              />
              <p className="text-xs text-gray-500 mt-1">
                만약 계획대로 청산했다면?
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-bold text-gray-800 mb-4">미리보기</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">실제 수익률:</span>
                <span className={`font-bold ${previewReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {previewReturn >= 0 ? '+' : ''}{previewReturn.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">실제 손익:</span>
                <span className={`font-bold ${previewProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {previewProfit >= 0 ? '+' : ''}{previewProfit.toLocaleString()}원
                </span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">계획대로 손익:</span>
                  <span className="font-bold text-blue-600">
                    {plannedProfit >= 0 ? '+' : ''}{plannedProfit.toLocaleString()}원
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">규율 손익:</span>
                  <span className={`font-bold text-lg ${previewDisciplineLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {previewDisciplineLoss >= 0 ? '+' : ''}{previewDisciplineLoss.toLocaleString()}원
                  </span>
                </div>
                
                {previewDisciplineLoss < 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ 계획보다 {Math.abs(previewDisciplineLoss).toLocaleString()}원 손실
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => closePosition(position.id, exitPrice, exitReason, plannedPrice)}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold"
            >
              청산 확정
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CALM 투자일지</h1>
          <p className="text-gray-600 mb-4">계획 vs 실제 비교, 규율 중심 투자 관리</p>
          
          {fileName && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <CheckCircle className="inline mr-2 text-green-600" size={16} />
                현재 파일: <strong>{fileName}</strong> | 마지막 업데이트: {lastUpdate}
              </p>
            </div>
          )}

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">보유 중</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPositions}개</p>
                </div>
                <TrendingUp className="text-blue-400" size={36} />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 손익</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalProfit >= 0 ? '+' : ''}{(stats.totalProfit / 10000).toFixed(0)}만
                  </p>
                </div>
                <DollarSign className="text-green-400" size={36} />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">규율 점수</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgDisciplineScore.toFixed(0)}점</p>
                </div>
                <Award className="text-purple-400" size={36} />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">규율 손익</p>
                  <p className={`text-2xl font-bold ${stats.totalDisciplineLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.totalDisciplineLoss >= 0 ? '+' : ''}{(stats.totalDisciplineLoss / 10000).toFixed(0)}만
                  </p>
                </div>
                <Target className="text-orange-400" size={36} />
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setCurrentTab('upload')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                currentTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Upload className="inline mr-2" size={20} />
              Excel 관리
            </button>
            <button
              onClick={() => setCurrentTab('positions')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                currentTab === 'positions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <TrendingUp className="inline mr-2" size={20} />
              현재 포지션
            </button>
            <button
              onClick={() => setCurrentTab('close')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                currentTab === 'close'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <DollarSign className="inline mr-2" size={20} />
              청산 처리
            </button>
            <button
              onClick={() => setCurrentTab('discipline')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                currentTab === 'discipline'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Award className="inline mr-2" size={20} />
              규율 분석
            </button>
          </div>
        </div>

        {/* Excel 관리 탭 */}
        {currentTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">엑셀 파일 관리</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Download className="mx-auto mb-4 text-blue-600" size={48} />
                <h3 className="text-lg font-bold text-gray-800 mb-2">1단계: 템플릿 다운로드</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Excel 템플릿을 다운로드하여<br />포지션 정보를 입력하세요
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  템플릿 다운로드
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto mb-4 text-green-600" size={48} />
                <h3 className="text-lg font-bold text-gray-800 mb-2">2단계: 파일 업로드</h3>
                <p className="text-sm text-gray-600 mb-4">
                  작성한 Excel 파일을<br />업로드하세요
                </p>
                <label className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold cursor-pointer inline-block">
                  파일 선택
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <AlertCircle className="mr-2 text-blue-600" size={20} />
                사용 안내
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Daily Scanner 결과를 "포지션목록"에 복사하세요</li>
                <li>• 날짜는 YYYY-MM-DD 형식으로 입력하세요</li>
                <li>• 청산 시 "청산기록" 시트에 결과를 기록하세요</li>
                <li>• 규율 손익은 자동으로 계산됩니다</li>
                <li>• 로컬 스토리지에 자동 저장됩니다</li>
              </ul>
            </div>

            {(data.positions.length > 0 || data.closed.length > 0) && (
              <div className="mt-6 text-center">
                <button
                  onClick={exportToExcel}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold inline-flex items-center"
                >
                  <Download className="mr-2" size={20} />
                  현재 데이터 Excel로 내보내기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 현재 포지션 탭 */}
        {currentTab === 'positions' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">현재 보유 포지션</h2>
            
            {data.positions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600">보유 중인 포지션이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.positions.map(position => {
                  const dday = getDday(position.plannedExitDate);
                  const currentReturn = ((position.currentPrice / position.entryPrice) - 1) * 100;
                  const targetProgress = (position.currentPrice / position.targetPrice) * 100;
                  
                  return (
                    <div key={position.id} className="border-2 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{position.name} ({position.ticker})</h3>
                          <p className="text-sm text-gray-600">{position.strategy} | 진입: {position.entryDate}</p>
                        </div>
                        <div className="text-right">
                          {dday !== null && (
                            <p className={`text-lg font-bold ${
                              dday < 0 ? 'text-red-600' :
                              dday <= 3 ? 'text-orange-600' :
                              'text-blue-600'
                            }`}>
                              {dday < 0 ? '청산일 지남' : 
                               dday === 0 ? '오늘 청산' :
                               `D-${dday}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-600">진입가</p>
                          <p className="text-lg font-bold">{position.entryPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-600">현재가</p>
                          <input
                            type="number"
                            value={position.currentPrice}
                            onChange={(e) => updateCurrentPrice(position.id, parseFloat(e.target.value) || 0)}
                            className="text-lg font-bold w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-600">목표가</p>
                          <p className="text-lg font-bold text-green-600">{position.targetPrice.toLocaleString()}원</p>
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-600">손절가</p>
                          <p className="text-lg font-bold text-red-600">{position.stopPrice.toLocaleString()}원</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded p-4">
                          <p className="text-sm text-gray-600 mb-1">현재 수익률</p>
                          <p className={`text-2xl font-bold ${currentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currentReturn >= 0 ? '+' : ''}{currentReturn.toFixed(2)}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            예상: +{position.expectedReturn.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded p-4">
                          <p className="text-sm text-gray-600 mb-1">목표가 달성률</p>
                          <p className={`text-2xl font-bold ${
                            targetProgress >= 95 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {targetProgress.toFixed(1)}%
                          </p>
                          {targetProgress >= 95 && (
                            <p className="text-xs text-green-600 mt-1 font-semibold">⭐ 목표 근접!</p>
                          )}
                        </div>
                      </div>

                      {position.entryReason && (
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                          📝 {position.entryReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 청산 처리 탭 */}
        {currentTab === 'close' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">청산 처리</h2>
            
            {data.positions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-600">청산할 포지션이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.positions.map(position => (
                  <ClosePositionCard key={position.id} position={position} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 규율 분석 탭 */}
        {currentTab === 'discipline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">규율 분석 대시보드</h2>
              
              {data.closed.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600">청산 내역이 없습니다.</p>
                </div>
              ) : (
                <>
                  {/* 요약 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600 mb-2">평균 규율 점수</p>
                      <p className="text-4xl font-bold text-blue-600 mb-1">
                        {stats.avgDisciplineScore.toFixed(0)}점
                      </p>
                      <p className="text-sm text-gray-500">
                        등급: {
                          stats.avgDisciplineScore >= 90 ? 'A' :
                          stats.avgDisciplineScore >= 80 ? 'B' :
                          stats.avgDisciplineScore >= 70 ? 'C' :
                          stats.avgDisciplineScore >= 60 ? 'D' : 'F'
                        }
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600 mb-2">총 규율 손익</p>
                      <p className={`text-4xl font-bold mb-1 ${stats.totalDisciplineLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.totalDisciplineLoss >= 0 ? '+' : ''}{(stats.totalDisciplineLoss / 10000).toFixed(0)}만원
                      </p>
                      <p className="text-sm text-gray-500">
                        {stats.totalDisciplineLoss >= 0 ? '계획 초과 달성' : '계획 미달'}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600 mb-2">총 거래 수</p>
                      <p className="text-4xl font-bold text-purple-600 mb-1">
                        {stats.totalClosed}회
                      </p>
                      <p className="text-sm text-gray-500">
                        승률: {stats.winRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* 청산 이유별 분석 */}
                  {exitReasonStats.length > 0 && (
                    <div className="mb-8">
                      <h3 className="font-bold text-lg text-gray-800 mb-4">청산 이유별 분석</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exitReasonStats.map(stat => (
                          <div key={stat.reason} className="border-2 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-gray-800">{stat.reason}</span>
                              <span className="text-sm text-gray-600">{stat.count}회</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">평균 손익:</span>
                              <span className={`font-bold ${stat.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.avgProfit >= 0 ? '+' : ''}{(stat.avgProfit / 10000).toFixed(1)}만원
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 규율 위반 케이스 */}
                  {disciplineIssues.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-4">
                        ⚠️ 개선이 필요한 케이스 (규율 손익 -1만원 이상)
                      </h3>
                      <div className="space-y-3">
                        {disciplineIssues.slice(0, 5).map(issue => (
                          <div key={issue.id} className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-gray-800">{issue.name} ({issue.ticker})</h4>
                                <p className="text-sm text-gray-600">{issue.exitReason} | {issue.exitDate}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-red-600">
                                  {(issue.disciplineLoss / 10000).toFixed(1)}만원
                                </p>
                                <p className="text-xs text-gray-500">규율 손익</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                              <div>
                                <p className="text-gray-600">실제 손익</p>
                                <p className={`font-bold ${issue.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {issue.actualProfit >= 0 ? '+' : ''}{(issue.actualProfit / 10000).toFixed(1)}만원
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">계획 손익</p>
                                <p className="font-bold text-blue-600">
                                  {issue.plannedProfit >= 0 ? '+' : ''}{(issue.plannedProfit / 10000).toFixed(1)}만원
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">규율 점수</p>
                                <p className="font-bold text-orange-600">
                                  {issue.disciplineScore.toFixed(0)}점 ({issue.disciplineGrade})
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 bg-white rounded p-3">
                              <p className="text-sm text-gray-700">
                                💡 <strong>개선 포인트:</strong> 
                                {issue.exitReason === '조기익절' && ' 목표가까지 인내 필요'}
                                {issue.exitReason === '조기손절' && ' 단기 변동성 무시, 계획 신뢰'}
                                {(issue.exitReason !== '조기익절' && issue.exitReason !== '조기손절') && ' 계획 준수 필요'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}