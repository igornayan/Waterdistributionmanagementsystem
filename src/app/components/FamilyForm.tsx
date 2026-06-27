import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { ArrowLeft, Plus, Trash2, Users, Droplets } from 'lucide-react';
import { MemberDTO, CisternDTO, FamilyDTO } from '../types';
import { toast } from 'sonner';

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;

export function FamilyForm() {
  const navigate = useNavigate();
  const { addFamily } = useData();

  const [familyName, setFamilyName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [hasGutterSystem, setHasGutterSystem] = useState(false);
  const [gutterEfficiencyCoefficient, setGutterEfficiencyCoefficient] = useState('0.8');
  const [gutterAreaM2, setGutterAreaM2] = useState('50');
  
  const [members, setMembers] = useState<MemberDTO[]>([
    { name: '', age: 0, isBedridden: false },
  ]);
  const [cisterns, setCisterns] = useState<CisternDTO[]>([
    { capacityLiters: 0, currentLevelLiters: 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMember = () => {
    setMembers([...members, { name: '', age: 0, isBedridden: false }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: keyof MemberDTO, value: any) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const addCistern = () => {
    setCisterns([...cisterns, { capacityLiters: 0, currentLevelLiters: 0 }]);
  };

  const removeCistern = (index: number) => {
    if (cisterns.length > 1) {
      setCisterns(cisterns.filter((_, i) => i !== index));
    }
  };

  const updateCistern = (index: number, field: keyof CisternDTO, value: number) => {
    const updated = [...cisterns];
    updated[index] = { ...updated[index], [field]: value };
    setCisterns(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    const validMembers = members.filter((m) => m.name.trim() !== '');
    if (validMembers.length === 0) {
      toast.error('Adicione pelo menos um membro da família');
      return;
    }

    const validCisterns = cisterns.filter((c) => c.capacityLiters > 0);
    if (validCisterns.length === 0) {
      toast.error('Adicione pelo menos uma cisterna com capacidade válida');
      return;
    }

    for (let i = 0; i < validCisterns.length; i++) {
      if (validCisterns[i].currentLevelLiters > validCisterns[i].capacityLiters) {
        toast.error(`Cisterna ${i + 1}: Volume atual não pode exceder a capacidade`);
        return;
      }
    }

    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);

    if (
      Number.isNaN(parsedLatitude) ||
      parsedLatitude < LATITUDE_MIN ||
      parsedLatitude > LATITUDE_MAX
    ) {
      toast.error(`Latitude deve estar entre ${LATITUDE_MIN} e ${LATITUDE_MAX}`);
      return;
    }

    if (
      Number.isNaN(parsedLongitude) ||
      parsedLongitude < LONGITUDE_MIN ||
      parsedLongitude > LONGITUDE_MAX
    ) {
      toast.error(`Longitude deve estar entre ${LONGITUDE_MIN} e ${LONGITUDE_MAX}`);
      return;
    }

    const family: FamilyDTO = {
      name: familyName,
      cisterns: validCisterns,
      hasGutterSystem,
      gutterEfficiencyCoefficient: hasGutterSystem ? parseFloat(gutterEfficiencyCoefficient) : null,
      gutterAreaM2: hasGutterSystem ? parseFloat(gutterAreaM2) : null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      members: validMembers,
      familyStatus: 'NORMAL',
    };

    setIsSubmitting(true);
    try {
      await addFamily(family);
      toast.success('Família cadastrada com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error('Erro ao cadastrar família: ' + (error.message || 'Desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Nova Família</CardTitle>
          <CardDescription>
            Preencha os dados da família e seus membros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados da Família</h3>

              <div className="space-y-2">
                <Label htmlFor="familyName">Nome da Família *</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Ex: Família Silva"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Cisternas *
                  </Label>
                  <Button type="button" size="sm" onClick={addCistern}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Cisterna
                  </Button>
                </div>

                {cisterns.map((cistern, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4 bg-blue-50/50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Cisterna {index + 1}</h4>
                      {cisterns.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCistern(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`cistern-capacity-${index}`}>
                          Capacidade da Cisterna (litros) *
                        </Label>
                        <Input
                          id={`cistern-capacity-${index}`}
                          type="number"
                          value={cistern.capacityLiters || ''}
                          onChange={(e) =>
                            updateCistern(index, 'capacityLiters', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Ex: 16000"
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`cistern-volume-${index}`}>
                          Volume Atual de Água (litros) *
                        </Label>
                        <Input
                          id={`cistern-volume-${index}`}
                          type="number"
                          value={cistern.currentLevelLiters || ''}
                          onChange={(e) =>
                            updateCistern(index, 'currentLevelLiters', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Ex: 8000"
                          min="0"
                          max={cistern.capacityLiters || 999999}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Ex: -8.0476"
                    min={LATITUDE_MIN}
                    max={LATITUDE_MAX}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Ex: -34.8770"
                    min={LONGITUDE_MIN}
                    max={LONGITUDE_MAX}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Membros da Família</h3>
                <Button type="button" variant="outline" size="sm" onClick={addMember}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
              </div>

              {members.map((member, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`member-name-${index}`}>Nome *</Label>
                          <Input
                            id={`member-name-${index}`}
                            value={member.name}
                            onChange={(e) => updateMember(index, 'name', e.target.value)}
                            placeholder="Nome completo"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`member-age-${index}`}>Idade *</Label>
                          <Input
                            id={`member-age-${index}`}
                            type="number"
                            value={member.age || ''}
                            onChange={(e) =>
                              updateMember(index, 'age', parseInt(e.target.value) || 0)
                            }
                            placeholder="Idade"
                            min="0"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`member-bedridden-${index}`}
                            checked={member.isBedridden}
                            onCheckedChange={(checked) =>
                              updateMember(index, 'isBedridden', checked)
                            }
                          />
                          <Label htmlFor={`member-bedridden-${index}`}>Acamado</Label>
                        </div>

                        {members.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/')} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar Família'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}