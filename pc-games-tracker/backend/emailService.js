import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendReleaseAlert(email, games) {
    const gamesList = games.map(game => {
        const releaseDate = new Date(game.release_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const daysLeft = Math.ceil((new Date(game.release_date) - new Date()) / (1000 * 60 * 60 * 24));
        return `
            <tr>
                <td style="padding:12px;border-bottom:1px solid #2a1a4e;">
                    ${game.background_image ? `<img src="${game.background_image}" style="width:80px;height:50px;object-fit:cover;border-radius:4px;">` : '🎮'}
                </td>
                <td style="padding:12px;border-bottom:1px solid #2a1a4e;">
                    <strong style="color:#fff;">${game.name}</strong><br>
                    <span style="color:#ff3c78;">📅 ${releaseDate}</span><br>
                    <span style="color:#00c8ff;">⏳ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!</span>
                </td>
            </tr>
        `;
    }).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <body style="background:#0a0a0f;font-family:'Segoe UI',sans-serif;margin:0;padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid #7828c8;">
                <div style="background:linear-gradient(90deg,#ff3c78,#7828c8,#00c8ff);padding:3px;">
                    <div style="background:#1a1a2e;padding:30px;text-align:center;">
                        <h1 style="color:#fff;font-size:1.8rem;margin:0;">🎮 Games Tracker</h1>
                        <p style="color:#00c8ff;margin:8px 0 0;letter-spacing:2px;font-size:0.85rem;">RELEASE ALERT</p>
                    </div>
                </div>
                <div style="padding:30px;">
                    <p style="color:#ccc;font-size:1rem;margin-bottom:20px;">
                        🔥 Good news! The following games from your wishlist are releasing soon:
                    </p>
                    <table style="width:100%;border-collapse:collapse;">
                        ${gamesList}
                    </table>
                    <div style="text-align:center;margin-top:30px;">
                        <a href="https://automation-project-sahar-production.up.railway.app/wishlist" 
                           style="background:linear-gradient(90deg,#ff3c78,#7828c8);color:#fff;padding:12px 30px;border-radius:20px;text-decoration:none;font-weight:bold;display:inline-block;">
                            VIEW MY WISHLIST 🔖
                        </a>
                    </div>
                    <p style="color:#555;font-size:0.75rem;text-align:center;margin-top:20px;">
                        You received this email because you subscribed to release alerts on Games Tracker.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    await transporter.sendMail({
        from: `"🎮 Games Tracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🔥 ${games.length} game${games.length > 1 ? 's' : ''} from your wishlist releasing soon!`,
        html
    });

    console.log(`✅ Release alert sent to ${email}`);
}