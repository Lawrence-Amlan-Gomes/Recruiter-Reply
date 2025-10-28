'use client'

import {useState} from 'react';
import { AuthContext } from '../contexts';

export default function AuthProvider({children}) {
    const [auth, setAuth] = useState(null);
    const [googleAuth, setGoogleAuth] = useState({name: "", email: "", image: ""});

    return(
        <AuthContext.Provider value={{auth, setAuth, googleAuth, setGoogleAuth}}>
            {children}
        </AuthContext.Provider>
    )
}