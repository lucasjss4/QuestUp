import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const homeHref = auth.user ? route('homePage') : route('login');

    return (
        <>
            <Head title="QuestUp">
                <meta name="description" content="Estude e se prepare para concursos com a QuestUp." />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#0b1425] text-white">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-end gap-4 px-6 py-5 sm:px-8">
                    {auth.user ? (
                        <Link
                            href={route('homePage')}
                            className="rounded-lg border border-white/25 px-4 py-2 text-sm transition-colors hover:border-white/60 hover:bg-white/5"
                        >
                            Início
                        </Link>
                    ) : (
                        <>
                            <Link href={route('login')} className="text-sm text-white/80 transition-colors hover:text-white">
                                Entrar
                            </Link>
                            <Link
                                href={route('register')}
                                className="rounded-lg border border-white/40 px-4 py-2 text-sm transition-colors hover:border-white hover:bg-white/5"
                            >
                                Cadastrar
                            </Link>
                        </>
                    )}
                </header>

                <main className="flex flex-1 items-center justify-center px-5 pb-8 sm:px-8 sm:pb-12">
                    <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#40516b] bg-gradient-to-br from-[#1a293e] to-[#101a2b] shadow-2xl shadow-black/30 lg:grid-cols-2">
                        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-14">
                            <h1 className="text-3xl leading-[1.08] font-bold tracking-tight sm:text-4xl">
                                Venha conhecer
                                <br />a QuestUp
                            </h1>
                            
                            <div className="mt-6 flex gap-4">
                                <div className="flex w-4 shrink-0 flex-col items-center" aria-hidden="true">
                                    <span className="size-3 rounded-full border-2 border-emerald-400 bg-emerald-400/20 shadow-[0_0_12px_rgba(16,226,171,0.65)]" />
                                    <span className="my-1 h-8 border-l border-dashed border-slate-500" />
                                    <span className="size-3 rounded-full border border-slate-500" />
                                </div>
                                <p className="max-w-xs text-base leading-6 text-slate-300 sm:text-lg">
                                    Plataforma para estudar e se preparar para concursos.
                                </p>
                            </div>

                            <Link
                                href={homeHref}
                                className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-medium text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#172438]"
                            >
                                Acessar plataforma
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        <div className="relative flex min-h-64 items-center justify-center bg-[#0b1425] p-4 pt-0 sm:min-h-80 sm:px-8 sm:pb-8 lg:min-h-[390px] lg:p-2">
                            <img src="/images/questup-welcome.jpg" alt="Logo QuestUp" className="h-full max-h-[390px] w-full object-contain" />
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
