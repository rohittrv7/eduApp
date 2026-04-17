'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useToggleMaintenanceModeMutation,
  PlatformSettings,
} from '@/store/adminApi';

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1a56db] focus:outline-none focus:ring-1 focus:ring-[#1a56db]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function Section({
  title, children, onSave, saving, feedback,
}: {
  title: string; children: React.ReactNode;
  onSave: () => void; saving: boolean;
  feedback: { msg: string; isError: boolean } | null;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-4">{children}</div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={onSave} disabled={saving}
          className="rounded-lg bg-[#1a56db] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save'}
        </button>
        {feedback && (
          <p className={`text-sm ${feedback.isError ? 'text-red-600' : 'text-green-600'}`}>{feedback.msg}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { data, isLoading } = useGetPlatformSettingsQuery();
  const [updateSettings] = useUpdatePlatformSettingsMutation();
  const [toggleMaintenance] = useToggleMaintenanceModeMutation();

  const [general, setGeneral] = useState({
    platformName: '', logoUrl: '', brandingColor: '#1a56db', contactEmail: '',
    socialLinks: { facebook: '', instagram: '', youtube: '', twitter: '' },
  });
  const [integrations, setIntegrations] = useState({
    smsGateway: 'msg91', smsApiKey: '', paymentGateway: 'razorpay',
    razorpayKeyId: '', razorpayWebhookSecret: '', fcmServerKey: '',
  });
  const [gamification, setGamification] = useState({
    skillThresholds: { basic: 0, intermediate: 40, advanced: 70, pro: 90 },
    referralRewardType: 'coupon' as 'coupon' | 'cashback',
    referralRewardValue: 0, attendanceWarningThreshold: 75,
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [generalFb, setGeneralFb] = useState<{ msg: string; isError: boolean } | null>(null);
  const [integrationsFb, setIntegrationsFb] = useState<{ msg: string; isError: boolean } | null>(null);
  const [gamificationFb, setGamificationFb] = useState<{ msg: string; isError: boolean } | null>(null);
  const [maintenanceFb, setMaintenanceFb] = useState<{ msg: string; isError: boolean } | null>(null);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingIntegrations, setSavingIntegrations] = useState(false);
  const [savingGamification, setSavingGamification] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  useEffect(() => {
    if (!data) return;
    setGeneral({
      platformName: data.platformName ?? '', logoUrl: data.logoUrl ?? '',
      brandingColor: data.brandingColor ?? '#1a56db', contactEmail: data.contactEmail ?? '',
      socialLinks: {
        facebook: data.socialLinks?.facebook ?? '', instagram: data.socialLinks?.instagram ?? '',
        youtube: data.socialLinks?.youtube ?? '', twitter: data.socialLinks?.twitter ?? '',
      },
    });
    setIntegrations({
      smsGateway: data.smsGateway ?? 'msg91', smsApiKey: data.smsApiKey ?? '',
      paymentGateway: data.paymentGateway ?? 'razorpay', razorpayKeyId: data.razorpayKeyId ?? '',
      razorpayWebhookSecret: data.razorpayWebhookSecret ?? '', fcmServerKey: data.fcmServerKey ?? '',
    });
    setGamification({
      skillThresholds: data.skillThresholds ?? { basic: 0, intermediate: 40, advanced: 70, pro: 90 },
      referralRewardType: data.referralRewardType ?? 'coupon',
      referralRewardValue: data.referralRewardValue ?? 0,
      attendanceWarningThreshold: data.attendanceWarningThreshold ?? 75,
    });
    setMaintenanceMode(data.maintenanceMode ?? false);
  }, [data]);

  async function saveSection(
    payload: Partial<PlatformSettings>,
    setSaving: (v: boolean) => void,
    setFb: (v: { msg: string; isError: boolean } | null) => void
  ) {
    setSaving(true); setFb(null);
    try {
      await updateSettings(payload).unwrap();
      setFb({ msg: 'Saved successfully.', isError: false });
    } catch {
      setFb({ msg: 'Failed to save. Please try again.', isError: true });
    } finally { setSaving(false); }
  }

  async function saveMaintenance() {
    setSavingMaintenance(true); setMaintenanceFb(null);
    try {
      await toggleMaintenance({ enabled: maintenanceMode }).unwrap();
      setMaintenanceFb({ msg: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}.`, isError: false });
    } catch {
      setMaintenanceFb({ msg: 'Failed to update.', isError: true });
    } finally { setSavingMaintenance(false); }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-9 rounded bg-gray-100" />
                  <div className="h-9 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>

        <Section title="General"
          onSave={() => saveSection({ platformName: general.platformName, logoUrl: general.logoUrl, brandingColor: general.brandingColor, contactEmail: general.contactEmail, socialLinks: general.socialLinks }, setSavingGeneral, setGeneralFb)}
          saving={savingGeneral} feedback={generalFb}>
          <Field label="Platform Name">
            <input type="text" className={inputCls} value={general.platformName}
              onChange={(e) => setGeneral((p) => ({ ...p, platformName: e.target.value }))} placeholder="allEdu" />
          </Field>
          <Field label="Logo URL">
            <input type="url" className={inputCls} value={general.logoUrl}
              onChange={(e) => setGeneral((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
          </Field>
          <Field label="Branding Color">
            <div className="flex items-center gap-3">
              <input type="color" className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-1"
                value={general.brandingColor} onChange={(e) => setGeneral((p) => ({ ...p, brandingColor: e.target.value }))} />
              <input type="text" className={`${inputCls} flex-1`} value={general.brandingColor}
                onChange={(e) => setGeneral((p) => ({ ...p, brandingColor: e.target.value }))} placeholder="#1a56db" />
            </div>
          </Field>
          <Field label="Contact Email">
            <input type="email" className={inputCls} value={general.contactEmail}
              onChange={(e) => setGeneral((p) => ({ ...p, contactEmail: e.target.value }))} placeholder="contact@example.com" />
          </Field>
          <p className="text-sm font-medium text-gray-700">Social Links</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['facebook', 'instagram', 'youtube', 'twitter'] as const).map((platform) => (
              <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                <input type="url" className={inputCls} value={general.socialLinks[platform]}
                  onChange={(e) => setGeneral((p) => ({ ...p, socialLinks: { ...p.socialLinks, [platform]: e.target.value } }))}
                  placeholder={`https://${platform}.com/...`} />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Integrations"
          onSave={() => saveSection({ smsGateway: integrations.smsGateway, smsApiKey: integrations.smsApiKey, paymentGateway: integrations.paymentGateway, razorpayKeyId: integrations.razorpayKeyId, razorpayWebhookSecret: integrations.razorpayWebhookSecret, fcmServerKey: integrations.fcmServerKey }, setSavingIntegrations, setIntegrationsFb)}
          saving={savingIntegrations} feedback={integrationsFb}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SMS Gateway">
              <select className={inputCls} value={integrations.smsGateway}
                onChange={(e) => setIntegrations((p) => ({ ...p, smsGateway: e.target.value }))}>
                <option value="msg91">MSG91</option>
                <option value="twilio">Twilio</option>
              </select>
            </Field>
            <Field label="SMS API Key">
              <input type="password" className={inputCls} value={integrations.smsApiKey}
                onChange={(e) => setIntegrations((p) => ({ ...p, smsApiKey: e.target.value }))} placeholder="••••••••" autoComplete="off" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Payment Gateway">
              <select className={inputCls} value={integrations.paymentGateway}
                onChange={(e) => setIntegrations((p) => ({ ...p, paymentGateway: e.target.value }))}>
                <option value="razorpay">Razorpay</option>
                <option value="cashfree">Cashfree</option>
              </select>
            </Field>
            <Field label="Razorpay Key ID">
              <input type="text" className={inputCls} value={integrations.razorpayKeyId}
                onChange={(e) => setIntegrations((p) => ({ ...p, razorpayKeyId: e.target.value }))} placeholder="rzp_live_..." />
            </Field>
          </div>
          <Field label="Razorpay Webhook Secret">
            <input type="password" className={inputCls} value={integrations.razorpayWebhookSecret}
              onChange={(e) => setIntegrations((p) => ({ ...p, razorpayWebhookSecret: e.target.value }))} placeholder="••••••••" autoComplete="off" />
          </Field>
          <Field label="FCM Server Key">
            <input type="password" className={inputCls} value={integrations.fcmServerKey}
              onChange={(e) => setIntegrations((p) => ({ ...p, fcmServerKey: e.target.value }))} placeholder="••••••••" autoComplete="off" />
          </Field>
        </Section>

        <Section title="Gamification"
          onSave={() => saveSection({ skillThresholds: gamification.skillThresholds, referralRewardType: gamification.referralRewardType, referralRewardValue: gamification.referralRewardValue, attendanceWarningThreshold: gamification.attendanceWarningThreshold }, setSavingGamification, setGamificationFb)}
          saving={savingGamification} feedback={gamificationFb}>
          <p className="text-sm font-medium text-gray-700">Skill Level Thresholds (min score %)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['basic', 'intermediate', 'advanced', 'pro'] as const).map((level) => (
              <Field key={level} label={level.charAt(0).toUpperCase() + level.slice(1)}>
                <input type="number" min={0} max={100} className={inputCls}
                  value={gamification.skillThresholds[level]}
                  onChange={(e) => setGamification((p) => ({ ...p, skillThresholds: { ...p.skillThresholds, [level]: Number(e.target.value) } }))} />
              </Field>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Referral Reward Type">
              <select className={inputCls} value={gamification.referralRewardType}
                onChange={(e) => setGamification((p) => ({ ...p, referralRewardType: e.target.value as 'coupon' | 'cashback' }))}>
                <option value="coupon">Coupon</option>
                <option value="cashback">Cashback</option>
              </select>
            </Field>
            <Field label="Referral Reward Value">
              <input type="number" min={0} className={inputCls} value={gamification.referralRewardValue}
                onChange={(e) => setGamification((p) => ({ ...p, referralRewardValue: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Attendance Warning Threshold (%)">
            <input type="number" min={0} max={100} className={`${inputCls} sm:w-40`}
              value={gamification.attendanceWarningThreshold}
              onChange={(e) => setGamification((p) => ({ ...p, attendanceWarningThreshold: Number(e.target.value) }))} />
          </Field>
        </Section>

        <Section title="Maintenance" onSave={saveMaintenance} saving={savingMaintenance} feedback={maintenanceFb}>
          <div className="flex items-start gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Maintenance Mode</p>
              <p className="mt-1 text-xs text-yellow-700">
                When enabled, the platform shows a maintenance page to all non-admin users.
              </p>
            </div>
            <button role="switch" aria-checked={maintenanceMode} onClick={() => setMaintenanceMode((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:ring-offset-2 ${maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {maintenanceMode && (
            <p className="text-sm font-medium text-red-600">⚠ Maintenance mode is ON. Students cannot access the platform.</p>
          )}
        </Section>
      </div>
    </DashboardLayout>
  );
}
