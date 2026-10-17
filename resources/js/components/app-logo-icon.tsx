import { type ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/images/questup-mark.png" alt="QuestUp" {...props} />;
}
