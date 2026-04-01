'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar, Package, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { getProductCategories, type Product, type ProductCategory } from '@/lib/supervisores-data';
import { embalajeRecordsService, type EmbalajeRecord } from '@/lib/embalaje-records-service';
import { AddEmbalajeRecordModal } from '@/components/supervisores/add-embalaje-record-modal';
import { EmbalajeAnalysis } from '@/components/supervisores/embalaje-analysis';
import { EmbalajeIndicadorGlobal } from '@/components/supervisores/embalaje-indicador-global';
import { scrollToSelectorWithRetry } from '@/hooks/useScrollRestoration';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

export default function EmbalajeRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [records, setRecords] = useState<EmbalajeRecord[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isIndicadorOpen, setIsIndicadorOpen] = useState(false);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);

  useEffect(() => {
    router.replace('/dashboard/supervisores?tab=embalaje');
  }, [router]);

  useEffect(() => {
    const recordIdToHighlight = searchParams?.get('highlightRecord');
    if (!recordIdToHighlight) return;

    setHighlightedRecordId(recordIdToHighlight);

    const cancel = scrollToSelectorWithRetry({
      selector: `[data-record-id="${recordIdToHighlight}"]`,
      offsetTop: 96,
      onFound: () => {
        setTimeout(() => setHighlightedRecordId(null), 3000);
      },
    });

    return () => cancel();
  }, [searchParams]);

  useEffect(() => {
    console.log('🔍 DEBUG: EmbalajeRecordsPage montado');
    console.log('🔍 DEBUG: Estado de isModalOpen:', isModalOpen);
  }, [isModalOpen]);

  return null;
}
