﻿class Utils
{
    public static delayPromise(duration: number, ...args: any): Promise<any>
    {
        return new Promise(resolve => setTimeout(() => resolve(args), duration));
    }

    /**
     * Resolves various icon options to display the correct one.
     * @param defaultIcon The icon defined in Home Assistant.
     * @param overrideIcon The user's override icon choice.
     */
    public static resolveIcon(defaultIcon: string, overrideIcon: string): string
    {
        if (overrideIcon && overrideIcon.length)
        {
            return overrideIcon;
        }
        if (defaultIcon && defaultIcon.length && /^mdi:/i.test(defaultIcon))
        {
            return defaultIcon.replace('mdi:', '');
        }
        return '';
    }

    /**
     * Preloads an image and notifies when done via a promise.
     * @param src The image URL to load.
     */
    public static preloadImage(src: string): Promise<string>
    {
        return new Promise((resolve, reject) =>
        {
            let img = new Image();

            img.onload = () => resolve(src);
            img.onerror = e => reject(e);

            img.src = src;
        });
    }
}