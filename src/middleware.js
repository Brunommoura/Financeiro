import { NextResponse } from 'next/server';

export function middleware(req) {
    // Esse console.log vai imprimir no seu terminal, não no navegador
    console.log("🔥 O MIDDLEWARE ESTÁ VIVO NA ROTA:", req.nextUrl.pathname);

    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        if (user === 'bruno' && pwd === 'antigravity2026') {
            return NextResponse.next();
        }
    }

    return new NextResponse('Acesso Negado.', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Acesso Restrito"',
        },
    });
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};