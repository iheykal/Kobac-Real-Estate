'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, Zap, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <img 
                  src="/icons/deal-unscreen.gif" 
                  alt="Deal" 
                  className="h-20 w-20 mr-4 bg-transparent relative z-10" 
                />
              </motion.div>
              <motion.h1 
                className="text-4xl sm:text-5xl font-bold text-slate-900 font-playfair"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                About Us
              </motion.h1>
            </motion.div>
            
            <motion.p 
              className="text-xl text-slate-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Kobac Real Estate is Somalia's #1 Real Estate Platform — built to connect buyers, renters, landlords, and agents in one trusted space.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-xl p-8 sm:p-12"
          >
            {/* Problem Statement */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 font-playfair">
                Solving the Real Estate Challenge
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed">
                We are solving the fragmented and informal property market in Mogadishu and beyond by offering a central platform where verified agents list real properties, customers find what they need, and deals are done transparently.
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Zap className="h-8 w-8 text-yellow-500 mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-playfair">
                  Our Mission
                </h2>
              </motion.div>
              <motion.p 
                className="text-lg text-slate-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Our mission is simple: <span className="font-semibold text-blue-600">🔑 Make real estate easy, safe, and fast — for everyone.</span>
              </motion.p>
            </motion.div>

            {/* What You Can Do */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-playfair">
                  With Kobac Real Estate you can:
                </h2>
              </motion.div>
              <div className="space-y-4">
                <motion.div 
                  className="flex items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <motion.div 
                    className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </motion.div>
                  <p className="text-lg text-slate-700">
                    <span className="font-semibold">Buy or rent homes confidently</span> — Browse verified properties with complete details and transparent pricing
                  </p>
                </motion.div>
                <motion.div 
                  className="flex items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.div 
                    className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.4, delay: 0.9 }}
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </motion.div>
                  <p className="text-lg text-slate-700">
                    <span className="font-semibold">Work with trusted freelance agents</span> — Connect with verified real estate professionals who understand the local market
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Trust & Safety */}
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div 
                className="flex items-center mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-slate-900">
                  Trusted & Transparent
                </h3>
              </motion.div>
              <motion.p 
                className="text-slate-700 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                Every property and agent on our platform is verified to ensure you get authentic listings and reliable service. We believe in transparency, which is why all our deals are done openly with clear terms and conditions.
              </motion.p>
            </motion.div>

            {/* Contact Information */}
            <motion.div 
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div 
                className="flex items-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-bold text-slate-900">
                  Contact Us
                </h3>
              </motion.div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <p className="text-lg text-slate-700 mb-4">
                  Ready to find your perfect property or list with us?
                </p>
                <div className="bg-white rounded-lg p-6 shadow-md inline-block">
                  <p className="text-slate-600 mb-2 font-medium">Call us today:</p>
                  <a 
                    href="tel:+252610251014" 
                    className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors duration-200"
                  >
                    +252 610251014
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
