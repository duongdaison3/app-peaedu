import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function Home() {
  const t = useTranslations('Index');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.09),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fafc_56%,#eef2ff_100%)] text-zinc-950">
      <div className="absolute inset-0 opacity-50 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-size-[80px_80px]" />
      <div className="absolute left-0 top-28 h-52 w-52 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/peaedu-logo.png" 
              alt="PEA Education" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-950">PEA Education</p>
              <p className="text-xs text-zinc-500">English assessment platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <Link href="/placement" className="transition hover:text-zinc-950">{t('placementTest')}</Link>
            <Link href="/login" className="transition hover:text-zinc-950">{t('login')}</Link>
          </nav>

          <Link href="/placement">
            <Button size="sm" className="rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 transition hover:-translate-y-0.5 hover:bg-zinc-800">
              {t('placementTest')}
            </Button>
          </Link>
        </header>

        <main className="flex flex-1 items-center py-8 lg:py-14">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <section className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                English placement, progress, and class tracking
              </div>

              <h1 className="max-w-2xl text-balance text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
                {t('title')}
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-zinc-600 sm:text-xl">
                {t('description')}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/placement">
                  <Button size="lg" className="rounded-full bg-zinc-950 px-7 text-base font-semibold text-white shadow-lg shadow-zinc-950/20 transition hover:-translate-y-0.5 hover:bg-zinc-800">
                    {t('placementTest')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="rounded-full border-zinc-300 bg-white/80 px-7 text-base font-semibold text-zinc-900 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-zinc-50">
                    {t('login')}
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-medium text-zinc-500">Placement</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">Start in 3 minutes</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-medium text-zinc-500">Skills</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">Listening to Writing</p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-medium text-zinc-500">Results</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-950">Clear next steps</p>
                </div>
              </div>
            </section>

            <aside className="relative mx-auto w-full max-w-xl">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-zinc-950/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-zinc-950/10 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Assessment dashboard</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-950">Placement to progress</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Live
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.5rem] bg-zinc-950 p-5 text-white">
                    <p className="text-sm text-white/70">New learner journey</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">Discover your level, instantly</p>
                    <p className="mt-3 text-sm leading-6 text-white/70">
                      Placement test, class mapping, and role-based access in one flow.
                    </p>
                    <div className="mt-6 space-y-3">
                      {[
                        ['Listening', '72%'],
                        ['Reading', '84%'],
                        ['Grammar', '90%'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-sm text-white/70">
                            <span>{label}</span>
                            <span>{value}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-white/15">
                            <div
                              className="h-2 rounded-full bg-white"
                              style={{ width: value }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Skills covered</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Listening', 'Reading', 'Writing', 'Speaking', 'Grammar', 'Vocabulary'].map((item) => (
                          <span key={item} className="rounded-full bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-linear-to-r from-slate-950 to-slate-800 p-4 text-white">
                      <p className="text-sm/6 text-white/70">Instant result preview</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">Anonymous when needed</p>
                      <p className="mt-2 text-sm text-white/70">Keep the first touch simple for new learners, then guide them into class placement.</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <section className="pb-10 pt-2">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['2+', 'Years building assessment tools'],
                ['50+', 'Learner-ready questions'],
                ['97%', 'Target completion rate'],
                ['100%', 'Placement-driven onboarding'],
              ].map(([value, label]) => (
                <div key={value} className="rounded-2xl bg-zinc-950 px-5 py-4 text-white">
                  <p className="text-3xl font-bold tracking-tight">{value}</p>
                  <p className="mt-1 text-sm text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16 pt-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Why PEA for English</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Placement that feels simple for learners, useful for teachers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
              The platform is tailored for English assessment, not computer training, so every visual and every label supports the way learners actually start.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Fast entry', 'A learner can start from the landing page, sign in, or jump straight into placement.'],
              ['Skill mapping', 'Results are organized around English skills, not generic course categories.'],
              ['Teacher-ready', 'Teachers and admins can still route users into classes and dashboards after testing.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[1.75rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
                <p className="text-lg font-semibold text-zinc-950">{title}</p>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-6">
          <div className="rounded-[2rem] bg-zinc-950 px-6 py-10 text-center text-white shadow-2xl shadow-zinc-950/20 sm:px-10">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to check your English level?</h3>
            <p className="mx-auto mt-3 max-w-2xl text-white/70">
              Start with the placement test, then continue into the right path for your role and skill level.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/placement">
                <Button size="lg" className="rounded-full bg-white px-7 text-base font-semibold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-zinc-100">
                  {t('placementTest')}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-transparent px-7 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                  {t('login')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
