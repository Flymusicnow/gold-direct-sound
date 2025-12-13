import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RouteCheckResult {
  route: string;
  passed: boolean;
  status: number;
  reason: string;
  responseTime: number;
  category: 'admin' | 'fan' | 'artist' | 'public';
}

export interface DBCheckResult {
  table: string;
  passed: boolean;
  count: number | null;
  responseTime: number;
  reason: string;
}

export interface ActivityLogCheck {
  passed: boolean;
  reason: string;
  lastEventTime: string | null;
  totalEvents: number;
}

export interface QAResults {
  routeChecks: RouteCheckResult[];
  dbChecks: DBCheckResult[];
  activityLogCheck: ActivityLogCheck;
  errorsLast24h: number;
  overallPassed: boolean;
  timestamp: string;
}

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/artists',
  '/admin/tracks',
  '/admin/approvals',
  '/admin/beta-codes',
  '/admin/features',
  '/admin/collab-entities',
  '/admin/matching',
  '/admin/activity',
  '/admin/brand-applications',
  '/admin/campaigns',
  '/admin/payouts',
  '/admin/roles',
  '/admin/qa',
];

const FAN_ROUTES = [
  '/fan',
  '/fan/feed',
  '/fan/artists',
  '/fan/playlists',
  '/fan/activity',
  '/fan/settings',
  '/fan/achievements',
  '/fan/missions',
];

const ARTIST_ROUTES = [
  '/studio',
  '/studio/profile',
  '/studio/tracks',
  '/studio/videos',
  '/studio/events',
  '/studio/analytics',
  '/studio/comments',
  '/studio/earnings',
  '/studio/presskit',
  '/studio/promo',
  '/studio/opportunities',
  '/studio/spotlight',
];

const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/pricing',
  '/learn',
  '/discover',
];

const DB_TABLES = [
  'profiles',
  'user_roles',
  'tracks',
  'artist_profiles',
  'follows',
  'admin_activity_logs',
  'runtime_errors',
];

export function useQAHealthCheck() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<QAResults | null>(null);

  const checkRoute = async (
    route: string,
    category: 'admin' | 'fan' | 'artist' | 'public'
  ): Promise<RouteCheckResult> => {
    const start = performance.now();
    try {
      // Use HEAD request for speed, fallback to GET
      const response = await fetch(route, {
        method: 'HEAD',
        credentials: 'include',
      });
      const responseTime = Math.round(performance.now() - start);

      if (response.ok || response.status === 304) {
        return {
          route,
          passed: true,
          status: response.status,
          reason: 'OK',
          responseTime,
          category,
        };
      }

      return {
        route,
        passed: false,
        status: response.status,
        reason: `HTTP ${response.status}`,
        responseTime,
        category,
      };
    } catch (error) {
      const responseTime = Math.round(performance.now() - start);
      return {
        route,
        passed: false,
        status: 0,
        reason: error instanceof Error ? error.message : 'Network error',
        responseTime,
        category,
      };
    }
  };

  const checkTable = async (table: string): Promise<DBCheckResult> => {
    const start = performance.now();
    try {
      const { count, error } = await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true });
      
      const responseTime = Math.round(performance.now() - start);

      if (error) {
        return {
          table,
          passed: false,
          count: null,
          responseTime,
          reason: error.message,
        };
      }

      return {
        table,
        passed: true,
        count: count ?? 0,
        responseTime,
        reason: 'OK',
      };
    } catch (error) {
      const responseTime = Math.round(performance.now() - start);
      return {
        table,
        passed: false,
        count: null,
        responseTime,
        reason: error instanceof Error ? error.message : 'Query failed',
      };
    }
  };

  const checkActivityLog = async (): Promise<ActivityLogCheck> => {
    try {
      const { data, error, count } = await supabase
        .from('admin_activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        return {
          passed: false,
          reason: error.message,
          lastEventTime: null,
          totalEvents: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          passed: false,
          reason: 'No activity events found',
          lastEventTime: null,
          totalEvents: count ?? 0,
        };
      }

      const lastEvent = new Date(data[0].created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (lastEvent < sevenDaysAgo) {
        return {
          passed: false,
          reason: 'No recent activity (>7 days old)',
          lastEventTime: data[0].created_at,
          totalEvents: count ?? 0,
        };
      }

      return {
        passed: true,
        reason: `Last event: ${formatTimeAgo(lastEvent)}`,
        lastEventTime: data[0].created_at,
        totalEvents: count ?? 0,
      };
    } catch (error) {
      return {
        passed: false,
        reason: error instanceof Error ? error.message : 'Check failed',
        lastEventTime: null,
        totalEvents: 0,
      };
    }
  };

  const checkErrors24h = async (): Promise<number> => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('runtime_errors')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);

      return count ?? 0;
    } catch {
      return -1; // Indicates error
    }
  };

  const runAllChecks = useCallback(async (): Promise<QAResults> => {
    setIsRunning(true);

    try {
      // Run route checks in parallel by category
      const adminChecks = Promise.all(
        ADMIN_ROUTES.map((r) => checkRoute(r, 'admin'))
      );
      const fanChecks = Promise.all(
        FAN_ROUTES.map((r) => checkRoute(r, 'fan'))
      );
      const artistChecks = Promise.all(
        ARTIST_ROUTES.map((r) => checkRoute(r, 'artist'))
      );
      const publicChecks = Promise.all(
        PUBLIC_ROUTES.map((r) => checkRoute(r, 'public'))
      );

      // Run DB checks in parallel
      const dbChecks = Promise.all(DB_TABLES.map(checkTable));

      // Run activity log check
      const activityCheck = checkActivityLog();

      // Run error count check
      const errorCheck = checkErrors24h();

      // Wait for all
      const [
        adminResults,
        fanResults,
        artistResults,
        publicResults,
        dbResults,
        activityResult,
        errorCount,
      ] = await Promise.all([
        adminChecks,
        fanChecks,
        artistChecks,
        publicChecks,
        dbChecks,
        activityCheck,
        errorCheck,
      ]);

      const allRouteChecks = [
        ...adminResults,
        ...fanResults,
        ...artistResults,
        ...publicResults,
      ];

      const routesPassed = allRouteChecks.filter((r) => r.passed).length;
      const dbPassed = dbResults.filter((d) => d.passed).length;
      const overallPassed =
        routesPassed === allRouteChecks.length &&
        dbPassed === dbResults.length &&
        activityResult.passed;

      const results: QAResults = {
        routeChecks: allRouteChecks,
        dbChecks: dbResults,
        activityLogCheck: activityResult,
        errorsLast24h: errorCount,
        overallPassed,
        timestamp: new Date().toISOString(),
      };

      setResults(results);
      return results;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const saveResults = useCallback(async (qaResults: QAResults, runType: 'manual' | 'scheduled') => {
    try {
      const routesPassed = qaResults.routeChecks.filter((r) => r.passed).length;
      const dbPassed = qaResults.dbChecks.filter((d) => d.passed).length;

      await supabase.from('qa_report_runs').insert({
        run_type: runType,
        overall_passed: qaResults.overallPassed,
        route_checks_passed: routesPassed,
        route_checks_total: qaResults.routeChecks.length,
        db_checks_passed: dbPassed,
        db_checks_total: qaResults.dbChecks.length,
        errors_24h: qaResults.errorsLast24h,
        report_sent_to: null,
      });
    } catch (error) {
      console.error('Failed to save QA results:', error);
    }
  }, []);

  return {
    isRunning,
    results,
    runAllChecks,
    saveResults,
  };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
