import Layout from "./Layout.jsx";

import Import from "./Import";

import Criteria from "./Criteria";

import Screening from "./Screening";

import Analytics from "./Analytics";

import Export from "./Export";

import DualReview from "./DualReview";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Import: Import,
    
    Criteria: Criteria,
    
    Screening: Screening,
    
    Analytics: Analytics,
    
    Export: Export,
    
    DualReview: DualReview,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Import />} />
                
                
                <Route path="/Import" element={<Import />} />
                
                <Route path="/Criteria" element={<Criteria />} />
                
                <Route path="/Screening" element={<Screening />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Export" element={<Export />} />
                
                <Route path="/DualReview" element={<DualReview />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}